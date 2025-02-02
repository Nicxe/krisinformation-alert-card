# Krisinformation Alert Card

Krisinformation Alert Card is a custom Lovelace card for Home Assistant designed to display crisis alerts from the [Krisinformation integration](https://github.com/Nicxe/krisinformation).

## Features

- Displays alert information in the following order:
  - **Header (Alert Headline)**
  - **Published**
  - **Coordinates**
  - **PushMessage** 
- Configurable options to show/hide individual attributes (Published, Coordinates, PushMessage, border, etc.)
 
 
> [!WARNING]
> Early alpha version with ongoing development and improvements

## Installation

You can install this card by following one of the guides below:

### With HACS (Recommended)

1. Click on the three dots in the top right corner of the HACS overview menu.
2. Select **Custom repositories**.
3. Add the repository URL: `https://github.com/Nicxe/krisinformation-alert-card`.
4. Set the type to **Dashboard**.
5. Click the **Add** button.
6. Search for **Krisinformation Alert Card** in HACS and click the **Download** button.

<details>
<summary>Without HACS</summary>



1. Download the `smhi-alert-card.js` file from the [latest release](https://github.com/Nicxe/krisinformation-alert-card/releases).
2. Place the `krisinformation-alert-card.js` file in your `config/www` folder.
3. Add a reference to `krisinformation-alert-card.js` in your dashboard. There are two ways to do this:
    - **Using the UI:** Go to _Settings_ → _Dashboards_ → _More Options_ → _Resources_ → _Add Resource_. Set the URL as `krisinformation-alert-card.js` and set the _Resource type_ to `JavaScript Module`.
      **Note:** If you do not see the Resources menu, you need to enable _Advanced Mode_ in your _User Profile_.
    - **Using YAML:** Add the following code to the `lovelace` section of your configuration:
        ```yaml
        resources:
          - url: /local/krisinformation-alert-card.js
            type: module
        ```

</details>