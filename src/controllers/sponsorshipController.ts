import { createHash, timingSafeEqual } from "node:crypto";
import type * as express from "express";
import { provide } from "@inversifyjs/binding-decorators";
import { inject } from "inversify";
import { Controller, Get, Post, Request, Response, Route, SuccessResponse, Tags } from "tsoa";
import { config } from "../config/values.js";
import { NotFoundError } from "../models/api/error.js";
import type { KofiPayment, SponsorshipProgress } from "../models/business/sponsorship.js";
import { SponsorshipService } from "../services/sponsorshipService.js";

interface KofiPayload {
  verification_token?: unknown;
  message_id?: unknown;
  kofi_transaction_id?: unknown;
  timestamp?: unknown;
  type?: unknown;
  amount?: unknown;
  currency?: unknown;
}

const verifiedToken = (token: unknown): boolean => {
  if (typeof token !== "string" || !config.kofiWebhookToken) return false;
  const actual = Buffer.from(token);
  const expected = Buffer.from(config.kofiWebhookToken);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};

const parsePayment = (raw: unknown): KofiPayment | undefined => {
  if (typeof raw !== "string") return undefined;
  let payload: KofiPayload;
  try {
    payload = JSON.parse(raw) as KofiPayload;
  } catch {
    return undefined;
  }
  if (!verifiedToken(payload.verification_token)) return undefined;
  if (payload.type !== "Donation" && payload.type !== "Subscription") return undefined;
  if (typeof payload.amount !== "string" && typeof payload.amount !== "number") return undefined;
  const amount = Number(payload.amount);
  const minorAmount = Math.round(amount * 10 ** config.kofiCurrencyDecimalPlaces);
  if (
    !Number.isFinite(amount) ||
    !Number.isSafeInteger(minorAmount) ||
    minorAmount <= 0 ||
    payload.currency !== config.kofiCurrency
  ) return undefined;
  const sourceId = payload.kofi_transaction_id ?? payload.message_id;
  if (typeof sourceId !== "string" || sourceId.length === 0) return undefined;
  const receivedAt = typeof payload.timestamp === "string" ? new Date(payload.timestamp) : new Date();
  if (Number.isNaN(receivedAt.getTime())) return undefined;
  return {
    amount,
    currency: payload.currency,
    receivedAt,
    // Keep an irreversible identifier for idempotency; do not retain Ko-fi's raw ID.
    eventId: createHash("sha256").update(sourceId).digest("hex"),
  };
};

@Route("sponsorship")
@Tags("Sponsorship")
@provide(SponsorshipController)
export class SponsorshipController extends Controller {
  constructor(@inject(SponsorshipService) private readonly sponsorship: SponsorshipService) {
    super();
  }

  @Get("progress")
  @Response<{ message: string }>(404, "Sponsorship is disabled")
  public async getProgress(): Promise<SponsorshipProgress> {
    const progress = await this.sponsorship.getProgress();
    if (!progress) throw new NotFoundError("Sponsorship is disabled");
    return progress;
  }

  @Post("webhook/kofi")
  @SuccessResponse("200", "Ko-fi payment accepted")
  public async receiveKofiWebhook(@Request() request: express.Request): Promise<void> {
    if (!this.sponsorship.isEnabled()) throw new NotFoundError("Sponsorship is disabled");
    const body: unknown = request.body;
    const rawData =
      typeof body === "object" && body !== null && "data" in body
        ? (body as { data?: unknown }).data
        : undefined;
    const payment = parsePayment(rawData);
    // Return one indistinguishable response for malformed, unverified, and ignored events.
    if (payment) await this.sponsorship.recordPayment(payment);
    this.setStatus(200);
  }
}
