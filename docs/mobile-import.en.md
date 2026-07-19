# Mobile QR import

<p><a href="./mobile-import.md">中文</a> · <strong>English</strong> · <a href="../README.en.md">Back to README</a></p>

The desktop page shows both the fixed mini-program code and a data QR code for the current receipt. The companion mini program validates the protocol and privacy-safe fields on the phone, then saves the private receipt to the user's anonymous account database:

1. Scan the fixed mini-program code in WeChat and open the companion mini program.
2. Tap the desktop-import action.
3. Scan the adjacent data QR code. Multipart receipts rotate one part at a time on the computer, while the mini program automatically reopens scanning until all parts are collected.
4. Validate the `cwr1`, `cwr2`, or multipart `cwr2p` prefix, checksum, and schema version.
5. Single codes decompress immediately. Multipart codes can arrive out of order, and missed parts are collected on the next rotation before the privacy-safe metrics are parsed.
6. Recognize a session, today, last-seven-days, or this-week range. New receipts use canonical facts for deduplication and are stored in the anonymous account database by default.
7. Render the selected template with Canvas and save it to the phone.

The phone keeps only multipart staging, pending database writes, and necessary caches. Saving a private receipt does not automatically join public statistics; participation in the AI Cooperative is a separate choice inside the companion mini program.

The QR code does not transfer an image. The desktop page and mini program independently render the same structured receipt data. Older QR codes without an explicit range field remain supported through the legacy label fallback. QR payloads exclude prompts, response text, source code, project paths, file names, and original session IDs.

The companion mini program is a separate product. This repository does not contain its source code, AppID, backend code, or server credentials.

See the [data schema and QR protocol](data-schema.en.md).
