# Krisinformation Alert Card (Deprecated)

This repository is deprecated.

The alert card has moved and is now bundled with the main integration:

https://github.com/Nicxe/krisinformation

## Release note: card moved to the integration repository

Starting with the integration-based distribution, this standalone card repository is no longer used for updates.

If you already use the card, migrate as follows:

1. Update **Krisinformation** integration in HACS (repository: `Nicxe/krisinformation`).
2. Remove/uninstall this deprecated HACS dashboard repository (`Nicxe/krisinformation-alert-card`).
3. Remove old Lovelace resources that point to this repo (for example `/hacsfiles/...` URLs), if present.
4. Keep your dashboard cards as they are. Card type is unchanged.
5. Restart Home Assistant once.
6. Hard-refresh the browser once (Ctrl/Cmd + Shift + R).

The integration now manages the card resource automatically and serves it from `/local/krisinformation-alert-card.js`.

For current installation, configuration, and usage instructions, see:

https://github.com/Nicxe/krisinformation

Please open all new issues and feature requests in the main repository:

https://github.com/Nicxe/krisinformation/issues

![Krisinformation Alert Card](https://github.com/user-attachments/assets/804dc285-35a0-4383-8c15-0183cd3a39f5)
