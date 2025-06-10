# Krisinformation Alert Card
<img alt="Maintenance" src="https://img.shields.io/maintenance/yes/2025"> <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/Nicxe/krisinformation-alert-card"><br>

<img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/Nicxe/krisinformation-alert-card">



## Overview

This custom card is designed for the [Krisinformation integration](https://github.com/Nicxe/krisinformation), allowing you to display crisis alerts (VMA) from Sveriges Radio's API for Important Public Announcements on your Home Assistant dashboards.


 
> [!WARNING]
> Early alpha version with ongoing development and improvements


<a href="https://buymeacoffee.com/niklasv" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>

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



1. Download the `krisinformation-alert-card.js` file from the [latest release](https://github.com/Nicxe/krisinformation-alert-card/releases).
2. Place the `krisinformation-alert-card.js` file in your `config/www` folder.
3. Add a reference to `/local/krisinformation-alert-card.js` in your dashboard. There are two ways to do this:
    - **Using the UI:** Go to _Settings_ → _Dashboards_ → _More Options_ → _Resources_ → _Add Resource_. Set the URL as `krisinformation-alert-card.js` and set the _Resource type_ to `JavaScript Module`.
      **Note:** If you do not see the Resources menu, you need to enable _Advanced Mode_ in your _User Profile_.
    - **Using YAML:** Add the following code to the `lovelace` section of your configuration:
        ```yaml
        resources:
          - url: /local/krisinformation-alert-card.js
            type: module
        ```

</details>

## Configuration

The card can be configured using the dashboard UI editor:

1. In the dashboard UI, click on the three dots in the top right corner.
2. Click **Edit Dashboard**.
3. Click the **Plus** button to add a new card.
4. Find **Custom: Krisinformation Alert Card.js** in the list.


#### Card Example in YAML

```yaml
type: custom:krisinformation-alert-card
entity: sensor.krisinformation_hela_sverige
title: Krisinformation Alerts
show_header: true
show_published: true
show_pushmessage: true
show_border: true
```

## Usage Screenshots

![Screenshot](https://github.com/Nicxe/krisinformation-alert-card/blob/main/screenshot.png)