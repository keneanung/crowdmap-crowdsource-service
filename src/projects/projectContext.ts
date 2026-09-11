import { provide } from "@inversifyjs/binding-decorators";
import type { Request } from "express";
import { inject } from "inversify";
import { config, type MapProject } from "../config/values.js";
import { NotFoundError, ServiceUnavailableError } from "../models/api/error.js";

export interface ProjectContext {
  readonly project: MapProject;
}

@provide(ProjectRegistry)
export class ProjectRegistry {
  private readonly projects = new Map(config.projects.map((p) => [p.id, p]));
  public all(): readonly MapProject[] {
    return Array.from(this.projects.values());
  }
  public get(id: string): MapProject | undefined {
    return this.projects.get(id);
  }
  public single(): MapProject | undefined {
    return config.projects.length === 1 ? config.projects[0] : undefined;
  }
}

export interface ProjectResolution {
  readonly context?: ProjectContext;
  readonly platform: boolean;
}

export abstract class ProjectContextResolver {
  abstract resolve(request: Pick<Request, "hostname">): ProjectResolution;
}

export class SingleProjectResolver implements ProjectContextResolver {
  constructor(private readonly registry: ProjectRegistry) {}
  resolve(): ProjectResolution {
    const project = this.registry.single();
    if (!project)
      throw new Error("SingleProjectResolver requires exactly one project");
    return { context: Object.freeze({ project }), platform: false };
  }
}

export class HostProjectResolver implements ProjectContextResolver {
  constructor(private readonly registry: ProjectRegistry) {}
  resolve(request: Pick<Request, "hostname">): ProjectResolution {
    const host = request.hostname.toLowerCase();
    if (config.platformHost === host) return { platform: true };
    const projectId = config.hostProjectMap[host];
    const project = projectId ? this.registry.get(projectId) : undefined;
    if (!project)
      throw new NotFoundError(`No map project is configured for host ${host}`);
    return { context: Object.freeze({ project }), platform: false };
  }
}

@provide(ProjectContextResolver)
export class ConfiguredProjectContextResolver implements ProjectContextResolver {
  private readonly resolver: ProjectContextResolver;
  constructor(@inject(ProjectRegistry) registry: ProjectRegistry) {
    this.resolver =
      config.projectResolver === "host"
        ? new HostProjectResolver(registry)
        : new SingleProjectResolver(registry);
  }
  resolve(request: Pick<Request, "hostname">): ProjectResolution {
    return this.resolver.resolve(request);
  }
}

export type ProjectRequest = Request & {
  projectContext?: ProjectContext;
  platformRequest?: boolean;
};

export const requireProjectContext = (
  request: ProjectRequest,
): ProjectContext => {
  if (!request.projectContext)
    throw new ServiceUnavailableError(
      "This endpoint requires a map project host",
    );
  return request.projectContext;
};
