import cors from "cors";
import express, {
  Request as ExRequest,
  Response as ExResponse,
  NextFunction,
  json,
  urlencoded,
} from "express";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { ValidateError } from "tsoa";
import { RegisterRoutes } from "../generated/routes";
import * as swaggerJson from "../generated/swagger.json";
import { AuthenticationError } from "./middlewares/security";

export const app = express();

app.use(
  urlencoded({
    extended: true,
  }),
);
app.use(json());
app.use("/docs", swaggerUi.serve, (_req: ExRequest, res: ExResponse) => {
  return res.send(swaggerUi.generateHTML(swaggerJson));
});

RegisterRoutes(app);

app.use(express.static(path.join(path.dirname(__dirname), "website")));

app.use(function notFoundHandler(_req, res: ExResponse) {
  res.status(404).send({
    message: "Not Found",
  });
});

app.use(function errorHandler(
  err: unknown,
  req: ExRequest,
  res: ExResponse,
  next: NextFunction,
): ExResponse | undefined {
  if (err instanceof ValidateError) {
    console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
    return res.status(422).json({
      message: "Validation Failed",
      details: err.fields,
    });
  }
  if (err instanceof AuthenticationError) {
    console.warn(`Caught Authentication Error for ${req.path}:`, err.message);
    return res.status(403).json({
      message: err.message,
    });
  }
  if (err instanceof Error) {
    console.error(err);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }

  next();
  return;
});
app.use(cors());
