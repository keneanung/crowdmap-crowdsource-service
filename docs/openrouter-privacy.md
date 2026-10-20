# OpenRouter disclosure and deployment settings

This guide applies when OpenRouter is the configured endpoint. A custom OpenAI-compatible endpoint may be local or hosted elsewhere; disclose its actual recipients and policies instead. The default structured input described below is unchanged. With `inputFormat: editorial`, requests contain grouped navigation facts and a generic housekeeping sentence, without IDs, endpoint room details or housekeeping counts/areas. Optional game/map names remain included. See README.md for configuration.

AI changelog generation is optional. The public How it works and Privacy Policy pages explain its purpose and the data sent. The deployment operator must also keep `platform.privacy.processorsAndTransfers` accurate for its hosting and AI providers. Append the AI disclosure to the existing hosting/backup disclosure rather than replacing it.

## Data sent by this service

The request goes from the service to OpenRouter over HTTPS, not from the player's browser. It contains the configured editorial instructions, optional game/map names, and a structured overview of the selected map's net changes: room/area names and IDs, changed scalar map properties, exit commands and destinations, label IDs, and counts of metadata/hash changes. It is not an upload of the whole map or the individual observation records.

Reporter identities, room/map metadata values and keys, and raw hashes are excluded. Player IP addresses, browser headers, and service administrator credentials are not forwarded in the AI request. OpenRouter receives the service's network connection and API credential. Free-text map names, room names, symbols and commands can still contain personal data entered by contributors; these exclusions do not make every request anonymous.

Successful notes are cached in process memory within the configured cache limits and returned to clients. The service's generation diagnostics contain outcomes, model identifiers, timings and token counts, not the prompt, generated prose or API key. Keep the credential in secret-mounted configuration outside Git and restrict access to it.

## Settings to check before making privacy claims

- Disable OpenRouter's optional input/output logging and its separate permission to use inputs/outputs for product improvement if you do not want those uses. OpenRouter says both are off by default; it still retains request metadata such as token counts and latency. Its documentation also describes anonymous prompt categorization. [Data collection](https://openrouter.ai/docs/guides/privacy/data-collection).
- Opt out of provider training for both free and paid models in the account privacy settings. Provider training and provider retention are separate issues; a no-training provider can still retain content. Check the actual hosting provider's policy, not just the model developer's name. Routing or `openrouter/free` can involve different providers. [Provider policies](https://openrouter.ai/docs/guides/privacy/provider-logging).
- If you need zero data retention, configure the account's ZDR restriction and verify that the selected endpoint is eligible. Do not promise ZDR merely because prompt logging is disabled. Stricter routing may leave a free model unavailable; the service then uses deterministic notes. [Zero data retention](https://openrouter.ai/docs/guides/features/zdr).
- Record the actual recipients, processing locations and applicable transfer arrangements, and review any required agreements. By default, OpenRouter configuration calls the global `https://openrouter.ai/api/v1/chat/completions` endpoint; it does not enforce EU-only processing. Do not describe the deployment as EEA-only based on the service's hosting location. OpenRouter documents separate regional endpoints for eligible plans. [Regional routing](https://openrouter.ai/docs/guides/privacy/provider-logging).

These are administrator account choices, not guarantees enforced by the current request payload. Review them when changing a model, router or hosting provider.

## Suggested deployment disclosure

Adapt this plain-text wording to the actual deployment. Replace the bracketed portions before publishing; do not add a no-training, no-retention or regional claim until verified.

> For AI-written map changelogs, we send a structured overview of selected map changes to OpenRouter and the model-hosting providers permitted by our account settings: [identify providers or maintain an up-to-date provider list]. This includes room and area names, exit commands and connections, changed map properties and change counts. Reporter identities, individual observation records, room/map metadata values and raw hashes are excluded. Free-text map content can nevertheless contain personal information supplied by contributors. OpenRouter and the model providers process this information to generate descriptions. [Describe the actual logging, training and retention settings, processing locations, and applicable international-transfer arrangements.] Generated notes are cached by this service and returned to clients. OpenRouter's privacy policy is available at https://openrouter.ai/privacy/.

The `processorsAndTransfers` field is rendered as escaped plain text, so use plain text and URLs rather than HTML. Keep the existing disclosure of other hosting, storage and backup providers. Also check that the deployment's stated processing purposes, legal basis and retention explanation cover this optional use; this template does not establish a legal basis or transfer mechanism.
