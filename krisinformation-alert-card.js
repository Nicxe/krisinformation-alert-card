class KrisinformationAlertCard extends HTMLElement {
  constructor() {
    super();
  }

  set hass(hass) {
    const entityId = this.config.entity;
    const stateObj = hass.states[entityId];
    if (!stateObj) {
      return;
    }

    const alerts = stateObj.attributes.alerts || [];


    if (this.lastChild && this._alerts === alerts) {
      return;
    }
    this._alerts = alerts;

    const card = document.createElement('ha-card');
    const style = document.createElement('style');
    style.textContent = `
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
        ${this.config.show_border === false
          ? 'border: none;'
          : 'border: 1px solid var(--primary-color);'}
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


    if (this.config.show_header !== false) {
      const header = document.createElement('div');
      header.className = 'header';
      header.innerHTML = `<div class="alert-headline">${this.config.title || stateObj.attributes.friendly_name}</div>`;
      card.appendChild(style);
      card.appendChild(header);
    } else {
      card.appendChild(style);
    }

    if (alerts.length === 0) {
      const noAlerts = document.createElement('div');
      noAlerts.className = 'no-alerts';
      noAlerts.textContent = 'Inga aktuella varningar.';
      card.appendChild(noAlerts);
    } else {
      alerts.forEach((alert) => {
        const box = document.createElement('div');
        box.className = 'alert-box';


        const boxHeader = document.createElement('div');
        boxHeader.className = 'alert-header';
        boxHeader.innerHTML = `<div class="alert-headline">${alert.Headline || 'N/A'}</div>`;
        box.appendChild(boxHeader);


        let detailsHTML = '';
        if (this.config.show_published !== false) {
          detailsHTML += `<b>Published:</b> ${alert.Published ? new Date(alert.Published).toLocaleString() : 'N/A'}<br>`;
        }
        if (this.config.show_pushmessage !== false) {
          detailsHTML += `${alert.PushMessage || 'N/A'}<br>`;
          detailsHTML += `<br>`;
        }
        const details = document.createElement('div');
        details.className = 'alert-details';
        details.innerHTML = detailsHTML;
        box.appendChild(details);
        card.appendChild(box);
      });
    }

    while (this.lastChild) {
      this.removeChild(this.lastChild);
    }
    this.appendChild(card);
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

  static getConfigElement() {
    return document.createElement('krisinformation-alert-card-editor');
  }

  static getStubConfig(hass, entities) {
    return {
      entity: entities.find(e => e.startsWith('sensor.')) || '',
      title: 'Krisinformation Alerts',
      show_header: true,
      show_published: true,
      show_pushmessage: true,
      show_border: true,
    };
  }
}

customElements.define('krisinformation-alert-card', KrisinformationAlertCard);

class KrisinformationAlertCardEditor extends HTMLElement {
  constructor() {
    super();
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass || !this._config) return;

    if (!this.lastChild) {
      const schema = [
        {
          name: 'entity',
          required: true,
          selector: {
            entity: {
              domain: 'sensor'
            }
          }
        },
        {
          name: 'title',
          selector: {
            text: {}
          }
        },
        {
          name: 'show_header',
          selector: {
            boolean: {}
          }
        },
        {
          name: 'show_published',
          selector: {
            boolean: {}
          }
        },
        {
          name: 'show_pushmessage',
          selector: {
            boolean: {}
          }
        },
        {
          name: 'show_border',
          selector: {
            boolean: {}
          }
        }
      ];

      const data = {
        entity: this._config.entity || '',
        title: this._config.title || '',
        show_header: this._config.show_header !== undefined ? this._config.show_header : true,
        show_published: this._config.show_published !== undefined ? this._config.show_published : true,
        show_pushmessage: this._config.show_pushmessage !== undefined ? this._config.show_pushmessage : true,
        show_border: this._config.show_border !== undefined ? this._config.show_border : true,
      };

      const form = document.createElement('ha-form');
      form.schema = schema;
      form.data = data;
      form.hass = this._hass;

      form.addEventListener('value-changed', (ev) => {
        if (!this._config || !this._hass) return;
        this._config = { ...this._config, ...ev.detail.value };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
      });
      this.appendChild(form);
    } else {
      const form = this.querySelector('ha-form');
      form.data = {
        entity: this._config.entity || '',
        title: this._config.title || '',
        show_header: this._config.show_header !== undefined ? this._config.show_header : true,
        show_published: this._config.show_published !== undefined ? this._config.show_published : true,
        show_pushmessage: this._config.show_pushmessage !== undefined ? this._config.show_pushmessage : true,
        show_border: this._config.show_border !== undefined ? this._config.show_border : true,
      };
    }
  }
}

customElements.define('krisinformation-alert-card-editor', KrisinformationAlertCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'krisinformation-alert-card',
  name: 'Krisinformation Alert Card',
  description: 'Displays Krisinformation alerts using the Krisinformation integration with configurable attributes'
});