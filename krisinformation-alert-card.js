/*
 * Krisinformation Alert Card
 * @license MIT (c) 2025 Niklas V
 */

import {
  LitElement,
  html,
  css,
} from 'https://unpkg.com/lit@2.8.0/index.js?module';

class KrisinformationAlertCard extends LitElement {
  static properties = {
    hass: { attribute: false },
    _alerts: { state: true },
    config: { state: true }
  };

  _alerts = [];
  config = {};

  static styles = css`
    ha-card {
      padding: 5px;
    }
    .header {
      padding: 16px;
      font-size: 1.5em;
      font-weight: bold;
      background-color: var(--primary-color);
      border-radius: 5px;
      color: white;
      border-bottom: 1px solid var(--divider-color);
      margin-bottom: 5px;
    }
    .alert-box {
      padding: 16px;
      margin-bottom: 5px;
      border-radius: 5px;
      background-color: var(--card-background-color);
    }
    .alert-header {
      margin-bottom: 10px;
    }
    .alert-headline {
      font-size: 1.2em;
      font-weight: bold;
      margin: 0;
    }
    .alert-details {
      font-size: 0.9em;
      line-height: 1.5;
    }
    .no-alerts {
      font-size: 1em;
      color: var(--secondary-text-color);
      padding: 16px;
    }
  `;

  set hass(hass) {
    this._hass = hass;
    if (!this.config?.entity) return;
    const stateObj = hass.states[this.config.entity];
    if (!stateObj) return;
    this._alerts = stateObj.attributes.alerts || [];
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to specify an entity.');
    }
    this.config = config;
  }

  getCardSize() {
    return 1 + (this._alerts ? this._alerts.length : 0);
  }

  render() {
    if (!this._hass) return html``;
    const stateObj = this._hass.states[this.config.entity];
    if (!stateObj) return html``;
    return html`
      <ha-card>
        ${this.config.show_header !== false
          ? html`<div class="header">
              <div class="alert-headline">
                ${this.config.title || stateObj.attributes.friendly_name}
              </div>
            </div>`
          : null}
        ${this._alerts.length === 0
          ? html`<div class="no-alerts">${this._localize('no_alerts')}</div>`
          : this._alerts.map(
              (alert) => html`<div
                class="alert-box"
                style="${this.config.show_border === false
                  ? 'border:none;'
                  : 'border:1px solid var(--primary-color);'}"
              >
                <div class="alert-header">
                  <div class="alert-headline">
                    ${alert.event || 'N/A'}
                  </div>
                </div>
                <div class="alert-details">
                  ${this.config.show_sent !== false
                    ? html`<b>${this._localize('sent')}:</b>
                        ${alert.sent
                          ? new Date(alert.sent).toLocaleString()
                          : 'N/A'}<br>`
                    : ''}
                  ${this.config.show_severity !== false
                    ? html`<b>${this._localize('severity')}:</b>
                        ${alert.severity || 'N/A'}<br>`
                    : ''}
                  ${this.config.show_areas !== false
                    ? html`<b>${this._localize('area')}:</b>
                        ${alert.areas || ''}<br>`
                    : ''}
                  ${this.config.show_description !== false
                    ? html`<br>${alert.description || 'N/A'}<br>`
                    : ''}
                  <br />
                </div>
              </div>`
            )}
      </ha-card>
    `;
  }

  _localize(key) {
    const lang = this._hass?.locale?.language || 'en';
    const t = KrisinformationAlertCard.translations;
    return (t[lang] && t[lang][key]) || t['en'][key] || key;
  }

  static get translations() {
    return {
      en: {
        no_alerts: 'No current alerts.',
        sent: 'Sent',
        severity: 'Severity',
        area: 'Area',
      },
      sv: {
        no_alerts: 'Inga aktuella varningar.',
        sent: 'Skickat',
        severity: 'Allvarlighetsgrad',
        area: 'Område',
      },
    };
  }

  static getConfigElement() {
    return document.createElement('krisinformation-alert-card-editor');
  }

  static getStubConfig(hass, entities) {
    return {
      entity: entities.find((e) => e.startsWith('sensor.')) || '',
      title: 'Krisinformation Alerts',
      show_header: true,
      show_sent: true,
      show_severity: true,
      show_areas: true,
      show_description: true,
      show_border: true,
    };
  }
}

if (!customElements.get('krisinformation-alert-card')) {
  customElements.define('krisinformation-alert-card', KrisinformationAlertCard);
}

class KrisinformationAlertCardEditor extends LitElement {
  static properties = {
    hass: { attribute: false },
    _config: { state: true },
  };

  _config = {};

  setConfig(config) {
    this._config = config;
  }

  _valueChanged(ev) {
    if (!this._config) return;
    this._config = { ...this._config, ...ev.detail.value };
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config: this._config } })
    );
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const schema = [
      { name: 'entity', required: true, selector: { entity: { domain: 'sensor' } } },
      { name: 'title', selector: { text: {} } },
      { name: 'show_header', selector: { boolean: {} } },
      { name: 'show_sent', selector: { boolean: {} } },
      { name: 'show_severity', selector: { boolean: {} } },
      { name: 'show_areas', selector: { boolean: {} } },
      { name: 'show_description', selector: { boolean: {} } },
      { name: 'show_border', selector: { boolean: {} } },
    ];
    const data = {
      entity: this._config.entity || '',
      title: this._config.title || '',
      show_header:
        this._config.show_header !== undefined ? this._config.show_header : true,
      show_sent:
        this._config.show_sent !== undefined ? this._config.show_sent : true,
      show_severity:
        this._config.show_severity !== undefined
          ? this._config.show_severity
          : true,
      show_areas:
        this._config.show_areas !== undefined ? this._config.show_areas : true,
      show_description:
        this._config.show_description !== undefined
          ? this._config.show_description
          : true,
      show_border:
        this._config.show_border !== undefined ? this._config.show_border : true,
    };
    return html`<ha-form
      .hass=${this.hass}
      .schema=${schema}
      .data=${data}
      @value-changed=${this._valueChanged}
    ></ha-form>`;
  }
}

if (!customElements.get('krisinformation-alert-card-editor')) {
  customElements.define(
    'krisinformation-alert-card-editor',
    KrisinformationAlertCardEditor
  );
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'krisinformation-alert-card',
  name: 'Krisinformation Alert Card',
  description:
    'Displays Krisinformation alerts using the Krisinformation integration with configurable attributes',
});
