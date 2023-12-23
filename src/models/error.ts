export interface ValidateErrorJSON {
    message: "Validation failed";
    details: Record<string, unknown>;
}