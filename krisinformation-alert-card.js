/*
 * Krisinformation Alert Card
 * @license MIT (c) 2025 Niklas V
 */

import { LitElement, html, css } from 'https://unpkg.com/lit?module';

class KrisinformationAlertCard extends LitElement {
  static properties = {
    hass: {},
    config: {},
    _expanded: {},
  };

  static styles = css`
    :host {
      /* Strength of the severity-tinted background when enabled (used in color-mix) */
      --kris-alert-bg-strong: 22%;
      --kris-alert-bg-soft: 12%;
    }

    ha-card {
      padding: 8px 0;
      background: transparent;
      box-shadow: none;
      border: none;
      --ha-card-background: transparent;
      --ha-card-border-width: 0;
      --ha-card-border-color: transparent;
    }
    .alerts {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 12px 12px 12px;
    }
    .alert {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: start;
      padding: 12px;
      border-radius: var(--kris-alert-border-radius, 8px);
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      position: relative;
    }

    /* Optional severity-tinted background (keeps normal card background as base) */
    .alert.bg-severity {
      background: linear-gradient(
          90deg,
          color-mix(in srgb, var(--kris-accent) var(--kris-alert-bg-strong, 22%), var(--card-background-color)) 0%,
          color-mix(in srgb, var(--kris-accent) var(--kris-alert-bg-soft, 12%), var(--card-background-color)) 55%,
          var(--card-background-color) 100%
        );
    }
    .alert::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-top-left-radius: inherit;
      border-bottom-left-radius: inherit;
      background: var(--kris-accent, var(--primary-color));
    }
    .alert.sev-minor { --kris-accent: var(--kris-alert-yellow, #f1c40f); }
    .alert.sev-moderate { --kris-accent: var(--kris-alert-orange, #e67e22); }
    .alert.sev-severe { --kris-accent: var(--kris-alert-red, var(--error-color, #e74c3c)); }
    .alert.sev-extreme { --kris-accent: var(--kris-alert-red, var(--error-color, #e74c3c)); }
    .alert.sev-unknown { --kris-accent: var(--primary-color); }

    .icon {
      width: 32px;
      height: 32px;
      margin-inline-start: 4px;
      margin-top: 2px;
      color: var(--kris-icon-color, var(--primary-color));
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .title {
      display: flex;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }
    .headline {
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .meta {
      color: var(--secondary-text-color);
      font-size: 0.9em;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
    }
    .details { margin-top: 6px; }
    .details-toggle {
      color: var(--primary-color);
      cursor: pointer;
      user-select: none;
      font-size: 0.95em;
    }
    .empty {
      color: var(--secondary-text-color);
      padding: 8px 12px 12px 12px;
    }

    /* Editor-only controls */
    .meta-fields { margin: 12px 0; padding: 0 12px; }
    .meta-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 6px 0; }
    .meta-name { color: var(--primary-text-color); }
    .order-actions { display: flex; gap: 6px; }
    .order-btn { background: var(--secondary-background-color); color: var(--primary-text-color); border: 1px solid var(--divider-color); border-radius: 4px; padding: 2px 6px; cursor: pointer; }
    .order-btn[disabled] { opacity: 0.4; cursor: default; }
  `;

  setConfig(config) {
    if (!config?.entity) throw new Error('You must specify an entity.');
    const normalized = this._normalizeConfig(config);
    this.config = normalized;
    this._expanded = {};
  }

  getCardSize() {
    const alerts = this._visibleAlerts();
    if (this.config?.hide_when_empty && (!alerts || alerts.length === 0)) return 0;
    const header = this._showHeader() ? 1 : 0;
    return header + (alerts ? alerts.length : 0);
  }

  _alerts() {
    if (!this.hass || !this.config) return [];
    const stateObj = this.hass.states?.[this.config.entity];
    const raw = stateObj ? stateObj.attributes?.alerts || [] : [];
    return this._normalizeCapAlerts(Array.isArray(raw) ? raw : []);
  }

  _visibleAlerts() {
    const alerts = this._alerts();
    if (!Array.isArray(alerts)) return [];
    const cfg = this.config || {};
    const filterSev = (cfg.filter_severities || []).map((s) => String(s).toLowerCase());
    const filterAreas = (cfg.filter_areas || []).map((s) => String(s).toLowerCase());

    const filtered = alerts.filter((a) => {
      const sev = String(a.severity || '').toLowerCase();
      const area = String(a.area || a.areas || '').toLowerCase();
      const sevOk = filterSev.length === 0 || filterSev.includes(sev);
      const areaOk = filterAreas.length === 0 || filterAreas.some((x) => area.includes(x));
      return sevOk && areaOk;
    });

    const sorted = [...filtered].sort((a, b) => {
      const order = cfg.sort_order || 'time_desc';
      if (order === 'severity_then_time') {
        const as = this._severityRank(a);
        const bs = this._severityRank(b);
        if (as !== bs) return bs - as; // higher first
      } else if (order === 'type_then_time') {
        const ae = String(a.event || '').toLowerCase();
        const be = String(b.event || '').toLowerCase();
        if (ae !== be) return ae.localeCompare(be);
      }
      const at = new Date(a.sent || a.published || 0).getTime();
      const bt = new Date(b.sent || b.published || 0).getTime();
      return bt - at;
    });

    const max = Number(cfg.max_items || 0);
    return max > 0 ? sorted.slice(0, max) : sorted;
  }

  _severityRank(item) {
    const sev = String(item?.severity || '').toLowerCase();
    switch (sev) {
      case 'extreme':
        return 4;
      case 'severe':
        return 3;
      case 'moderate':
        return 2;
      case 'minor':
        return 1;
      default:
        return 0;
    }
  }

  _severityClass(item) {
    const sev = String(item?.severity || '').toLowerCase();
    if (sev === 'minor') return 'sev-minor';
    if (sev === 'moderate') return 'sev-moderate';
    if (sev === 'severe') return 'sev-severe';
    if (sev === 'extreme') return 'sev-extreme';
    return 'sev-unknown';
  }

  _iconTemplate(item) {
    if (this.config.show_icon === false) return html``;
    const icon = this.config.icon || 'mdi:alert-circle-outline';
    const color = this.config.icon_color || '';
    const style = color ? `color:${color}` : '';
    return html`<ha-icon class="icon" style="${style}" icon="${icon}" aria-hidden="true"></ha-icon>`;
  }

  render() {
    if (!this.hass || !this.config) return html``;
    const stateObj = this.hass.states?.[this.config.entity];
    if (!stateObj) return html``;
    const t = this._t.bind(this);
    const alerts = this._visibleAlerts();

    if (this.config.hide_when_empty && alerts.length === 0) return html``;

    const header = this._showHeader() ? (this.config.title || stateObj.attributes?.friendly_name || 'Krisinformation') : undefined;

    return html`
      <ha-card header=${header}>
        ${alerts.length === 0
          ? html`<div class="empty">${t('no_alerts')}</div>`
          : html`<div class="alerts">${this._renderGrouped(alerts)}</div>`}
      </ha-card>
    `;
  }

  _renderGrouped(alerts) {
    const groupBy = this.config?.group_by || 'none';
    if (groupBy === 'none') {
      return alerts.map((item, idx) => this._renderAlert(item, idx));
    }

    // Build group map based on requested key
    const groups = {};
    const getKey = (a) => {
      if (groupBy === 'area') return a.area || a.areas || '—';
      if (groupBy === 'severity') return (a.severity || 'Unknown');
      if (groupBy === 'type') return (a.event || '—');
      return '—';
    };
    for (const a of alerts) {
      const key = getKey(a);
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }

    // Sort group keys
    let keys = Object.keys(groups);
    if (groupBy === 'severity') {
      keys.sort((ka, kb) => {
        const ra = this._severityRank({ severity: ka });
        const rb = this._severityRank({ severity: kb });
        return rb - ra; // higher severity first
      });
    } else {
      keys.sort((a, b) => String(a).localeCompare(String(b)));
    }

    return keys.map((key) => html`
      <div class="area-group">
        <div class="meta" style="margin: 0 12px;">${key}</div>
        ${groups[key].map((item, idx) => this._renderAlert(item, idx))}
      </div>
    `);
  }

  _renderAlert(item, idx) {
    const t = this._t.bind(this);
    const sevClass = this._severityClass(item);
    const expanded = !!this._expanded[this._alertKey(item, idx)];
    const showIcon = this.config.show_icon !== false;
    const sevBgClass = this.config?.severity_background ? 'bg-severity' : '';

    const metaFields = {
      area: (this.config.show_area !== false && (item.area || item.areas))
        ? html`<span><b>${t('area')}:</b> ${item.area || item.areas}</span>`
        : null,
      type: (this.config.show_type !== false && item.event)
        ? html`<span><b>${t('type')}:</b> ${item.event}</span>`
        : null,
      severity: (this.config.show_severity !== false && item.severity)
        ? html`<span><b>${t('severity')}:</b> ${item.severity}</span>`
        : null,
      sent: (this.config.show_sent !== false && item.sent)
        ? html`<span><b>${t('sent')}:</b> ${this._fmtTs(item.sent)}</span>`
        : null,
    };
    const order = Array.isArray(this.config.meta_order) && this.config.meta_order.length
      ? this.config.meta_order
      : ['area', 'type', 'severity', 'sent'];
    const parts = order
      .map((key) => metaFields[key])
      .filter((node) => !!node);

    const headline = item.headline || item.event || '';
    const description = item.description || '';

    return html`
      <div
        class="alert ${sevClass} ${sevBgClass}"
        role="button"
        tabindex="0"
        aria-label="${item.headline || item.event || ''}"
        @pointerdown=${(e) => this._onPointerDown(e)}
        @pointerup=${(e) => this._onPointerUp(e, item)}
        @keydown=${(e) => this._onKeydown(e, item)}
      >
        ${showIcon ? html`<div>${this._iconTemplate(item)}</div>` : html``}
        <div class="content">
          <div class="title">
            <div class="headline">${headline || description || (item.area || item.areas) || ''}</div>
          </div>
          ${parts.length > 0 ? html`<div class="meta">${parts}</div>` : html``}
          ${this.config.show_details !== false && (item.details || description)
            ? (() => {
                const canCollapse = this.config.collapse_details !== false; // default true
                const content = String(item.details || description || '');
                if (!canCollapse) {
                  return html`<div class="details">${this._markdown(content)}</div>`;
                }
                return html`
                  <div class="details">
                    <div
                      class="details-toggle"
                      @click=${(e) => this._toggleDetails(e, item, idx)}
                      @pointerdown=${(e) => e.stopPropagation()}
                      @pointerup=${(e) => e.stopPropagation()}
                      @keydown=${(e) => e.stopPropagation()}
                    >
                      ${expanded ? t('hide_details') : t('show_details')}
                    </div>
                    ${expanded ? this._markdown(content) : html``}
                  </div>`;
              })()
            : html``}
        </div>
        <div></div>
      </div>`;
  }

  _toggleDetails(e, item, idx) {
    e.stopPropagation();
    const key = this._alertKey(item, idx);
    this._expanded = { ...this._expanded, [key]: !this._expanded[key] };
  }

  _onPointerDown(e) {
    if (e.button !== 0) return;
    clearTimeout(this._holdTimer);
    this._holdFired = false;
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
    }, 500);
  }

  _onPointerUp(e, item) {
    if (e.button !== 0) return;
    clearTimeout(this._holdTimer);
    if (this._holdFired) {
      this._runAction(this.config?.hold_action || this.config?.tap_action || { action: 'more-info' }, item);
      return;
    }
    const now = Date.now();
    if (this._lastTap && now - this._lastTap < 250) {
      this._lastTap = 0;
      this._runAction(this.config?.double_tap_action || this.config?.tap_action || { action: 'more-info' }, item);
    } else {
      this._lastTap = now;
      clearTimeout(this._tapTimer);
      this._tapTimer = setTimeout(() => {
        if (this._lastTap && Date.now() - this._lastTap >= 250) {
          this._lastTap = 0;
          this._runAction(this.config?.tap_action || { action: 'more-info' }, item);
        }
      }, 260);
    }
  }

  _onKeydown(e, item) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._runAction(this.config?.tap_action || { action: 'more-info' }, item);
    }
  }

  _alertKey(item, idx) {
    return `${String(item.severity || '')}-${String(item.area || item.areas || '')}-${String(item.sent || item.published || idx)}`;
  }

  _fmtTs(value) {
    if (!value) return '';
    try {
      const d = new Date(value);
      return d.toLocaleString();
    } catch (e) {
      return String(value);
    }
  }

  _showHeader() {
    return this.config?.show_header !== false;
  }

  shouldUpdate(changed) {
    if (changed.has('config')) return true;
    if (changed.has('hass')) {
      const alerts = this._alerts();
      const key = JSON.stringify(
        alerts?.map((m) => [
          m.severity,
          m.area || m.areas,
          m.sent,
          m.published,
          m.event,
          m.headline,
          m.description,
          m.details,
        ])
      );
      if (this._lastKey !== key) {
        this._lastKey = key;
        return true;
      }
      return false;
    }
    return true;
  }

  _t(key) {
    const lang = (this.hass?.language || this.hass?.locale?.language || 'en').toLowerCase();
    const dict = {
      en: {
        no_alerts: 'No alerts',
        area: 'Area',
        type: 'Type',
        severity: 'Severity',
        sent: 'Sent',
        show_details: 'Show details',
        hide_details: 'Hide details',
        unknown: 'Unknown',
      },
      sv: {
        no_alerts: 'Inga varningar',
        area: 'Område',
        type: 'Typ',
        severity: 'Allvarlighetsgrad',
        sent: 'Skickat',
        show_details: 'Visa detaljer',
        hide_details: 'Dölj detaljer',
        unknown: 'Okänt',
      },
    };
    return (dict[lang] || dict.en)[key] || key;
  }

  _markdown(content) {
    const text = String(content || '');
    try {
      // If ha-markdown is available, use it. Set both property and attribute to be safe.
      // eslint-disable-next-line no-undef
      if (customElements && customElements.get && customElements.get('ha-markdown')) {
        return html`<ha-markdown breaks .content=${text} content=${text}></ha-markdown>`;
      }
    } catch (_) {
      // ignore and fallback
    }
    return html`<div class="details-text">${text}</div>`;
  }

  // Normalize alerts coming from CAP-like structure to the card's expected shape
  _normalizeCapAlerts(alerts) {
    if (!Array.isArray(alerts)) return [];
    const langPref = (this.hass?.language || this.hass?.locale?.language || 'sv').toLowerCase();
    return alerts
      .map((a) => {
        // If it's already in the expected shape (legacy), keep as-is with a small area normalization
        if (!this._isCapAlert(a)) {
          const area = a.area || a.areas || '';
          return { ...a, area, areas: area };
        }

        const info = this._pickInfo(a.info, langPref);
        const areaList = Array.isArray(info?.area) ? info.area : [];
        const areaNames = this._joinUnique(areaList.map((x) => this._stringOrEmpty(x?.areaDesc)));
        const areaStr = areaNames.join(', ');
        const headline = this._stringOrEmpty(info?.headline);
        const description = this._stringOrEmpty(info?.description);
        const instruction = this._stringOrEmpty(info?.instruction);
        const detailsParts = [];
        if (description) detailsParts.push(description);
        if (instruction) detailsParts.push(instruction);
        if (info?.web) detailsParts.push(String(info.web));

        return {
          // primary fields used by the card
          severity: this._stringOrEmpty(info?.severity) || 'Unknown',
          event: this._stringOrEmpty(info?.event),
          area: areaStr,
          areas: areaStr,
          sent: a.sent || info?.sent || info?.effective || info?.onset || null,
          published: a.sent || info?.effective || info?.onset || null,
          headline,
          description,
          details: detailsParts.join('\n\n'),
          // optional extras preserved for future use
          identifier: a.identifier,
          url: info?.web || null,
          source: a.sender || null,
          expires: info?.expires || null,
          urgency: info?.urgency || null,
          certainty: info?.certainty || null,
        };
      })
      .filter((x) => x && (x.severity || x.event || x.area || x.details || x.description));
  }

  _isCapAlert(a) {
    if (!a || typeof a !== 'object') return false;
    // Heuristic: CAP alert objects have top-level fields like 'identifier', 'sender', 'msgType', and nested 'info'
    return !!(a.info || a.msgType || a.sender || a.identifier);
  }

  _pickInfo(info, langPref) {
    if (!info) return {};
    if (Array.isArray(info)) {
      const lp = String(langPref || '').toLowerCase();
      const candidates = [lp, lp.split('-')[0], 'sv-se', 'sv', 'en-us', 'en'];
      for (const c of candidates) {
        const found = info.find((i) => String(i?.language || '').toLowerCase() === c);
        if (found) return found;
      }
      return info[0] || {};
    }
    return info || {};
  }

  _stringOrEmpty(v) {
    return v == null ? '' : String(v);
  }

  _joinUnique(list) {
    const set = new Set();
    for (const item of list || []) {
      const s = this._stringOrEmpty(item).trim();
      if (s) set.add(s);
    }
    return Array.from(set);
  }

  _normalizeConfig(config) {
    const normalized = { ...config };
    // Backwards compatibility
    if (normalized.show_areas !== undefined && normalized.show_area === undefined) {
      normalized.show_area = normalized.show_areas;
    }
    // Defaults
    if (normalized.show_header === undefined) normalized.show_header = true;
    if (normalized.show_icon === undefined) normalized.show_icon = true;
    if (normalized.severity_background === undefined) normalized.severity_background = false;
    if (normalized.hide_when_empty === undefined) normalized.hide_when_empty = false;
    if (normalized.max_items === undefined) normalized.max_items = 0;
    if (normalized.sort_order === undefined) normalized.sort_order = 'time_desc';
    if (normalized.group_by === undefined) normalized.group_by = 'none';
    if (!Array.isArray(normalized.filter_severities)) normalized.filter_severities = [];
    if (!Array.isArray(normalized.filter_areas)) normalized.filter_areas = [];
    if (normalized.collapse_details === undefined) normalized.collapse_details = true;
    if (normalized.show_area === undefined) normalized.show_area = true;
    if (normalized.show_type === undefined) normalized.show_type = true;
    if (normalized.show_severity === undefined) normalized.show_severity = true;
    if (normalized.show_sent === undefined) normalized.show_sent = true;
    if (normalized.show_details === undefined) normalized.show_details = true;
    // Back-compat: if legacy show_description was set, treat it as show_details
    if (normalized.show_details === undefined && normalized.show_description !== undefined) {
      normalized.show_details = normalized.show_description;
    }
    // Remove legacy field from normalized config to avoid confusion
    if (Object.prototype.hasOwnProperty.call(normalized, 'show_description')) {
      delete normalized.show_description;
    }
    if (normalized.show_border === undefined) normalized.show_border = true; // compat, but unused
    if (!Array.isArray(normalized.meta_order) || normalized.meta_order.length === 0) {
      normalized.meta_order = ['area', 'type', 'severity', 'sent'];
    }
    return normalized;
  }

  static getConfigElement() {
    return document.createElement('krisinformation-alert-card-editor');
  }

  static getStubConfig(hass, entities) {
    return {
      entity: (entities || []).find((e) => e && e.startsWith('sensor.')) || '',
      title: '',
      show_header: true,
      show_icon: true,
      severity_background: false,
      icon: 'mdi:alert-circle-outline',
      hide_when_empty: true,
      max_items: 0,
      sort_order: 'time_desc',
      group_by: 'none',
      filter_severities: [],
      filter_areas: [],
      collapse_details: true,
      show_area: true,
      show_type: true,
      show_severity: true,
      show_sent: true,
      show_details: true,
      meta_order: ['area', 'type', 'severity', 'sent'],
    };
  }
}

if (!customElements.get('krisinformation-alert-card')) {
  customElements.define('krisinformation-alert-card', KrisinformationAlertCard);
}

class KrisinformationAlertCardEditor extends LitElement {
  static properties = {
    hass: {},
    _config: {},
  };

  static styles = css`
    .container { padding: 8px 0 0 0; }
    .meta-fields { margin: 12px 0; padding: 8px 12px; }
    .meta-fields-title { color: var(--secondary-text-color); margin-bottom: 6px; }
    .meta-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 8px; padding: 6px 0; }
    .meta-name { color: var(--primary-text-color); }
    .order-actions { display: flex; gap: 6px; }
    .order-btn { background: var(--secondary-background-color); color: var(--primary-text-color); border: 1px solid var(--divider-color); border-radius: 4px; padding: 2px 6px; cursor: pointer; }
    .order-btn[disabled] { opacity: 0.4; cursor: default; }
  `;

  setConfig(config) {
    this._config = config;
  }

  render() {
    if (!this.hass || !this._config) return html``;
    const schema = [
      { name: 'entity', label: 'Entity', required: true, selector: { entity: { domain: 'sensor' } } },
      { name: 'title', label: 'Title', selector: { text: {} } },
      { name: 'show_header', label: 'Show header', selector: { boolean: {} } },
      { name: 'hide_when_empty', label: 'Hide when empty', selector: { boolean: {} } },
      { name: 'show_icon', label: 'Show icon', selector: { boolean: {} } },
      { name: 'severity_background', label: 'Severity background', selector: { boolean: {} } },
      { name: 'icon', label: 'Icon (mdi:...)', selector: { text: {} } },
      { name: 'icon_color', label: 'Icon color (CSS)', selector: { text: {} } },
      { name: 'max_items', label: 'Max items', selector: { number: { min: 0, mode: 'box' } } },
      { name: 'sort_order', label: 'Sort order', selector: { select: { mode: 'dropdown', options: [
        { value: 'time_desc', label: 'Time (newest first)' },
        { value: 'severity_then_time', label: 'Severity then time' },
        { value: 'type_then_time', label: 'Type then time' },
      ] } } },
      { name: 'group_by', label: 'Group by', selector: { select: { mode: 'dropdown', options: [
        { value: 'none', label: 'No grouping' },
        { value: 'area', label: 'By area' },
        { value: 'severity', label: 'By severity' },
        { value: 'type', label: 'By type' },
      ] } } },
      { name: 'filter_severities', label: 'Filter severities', selector: { select: { multiple: true, options: [
        { value: 'Minor', label: 'Minor' },
        { value: 'Moderate', label: 'Moderate' },
        { value: 'Severe', label: 'Severe' },
        { value: 'Extreme', label: 'Extreme' },
        { value: 'Unknown', label: 'Unknown' },
      ] } } },
      { name: 'filter_areas', label: 'Filter areas (comma-separated)', selector: { text: {} } },
      { name: 'collapse_details', label: 'Collapse details', selector: { boolean: {} } },
      { name: 'show_details', label: 'Show details', selector: { boolean: {} } },
      // actions (use ui_action selector like in smhi-alert-card)
      { name: 'tap_action', label: 'Tap action', selector: { ui_action: {} } },
      { name: 'double_tap_action', label: 'Double tap action', selector: { ui_action: {} } },
      { name: 'hold_action', label: 'Hold action', selector: { ui_action: {} } },
    ];

    const data = {
      entity: this._config.entity || '',
      title: this._config.title || '',
      show_header: this._config.show_header !== undefined ? this._config.show_header : true,
      show_icon: this._config.show_icon !== undefined ? this._config.show_icon : true,
      severity_background: this._config.severity_background !== undefined ? this._config.severity_background : false,
      icon: this._config.icon || 'mdi:alert-circle-outline',
      icon_color: this._config.icon_color || '',
      hide_when_empty: this._config.hide_when_empty !== undefined ? this._config.hide_when_empty : false,
      max_items: this._config.max_items ?? 0,
      sort_order: this._config.sort_order || 'time_desc',
      group_by: this._config.group_by || 'none',
      filter_severities: this._config.filter_severities || [],
      filter_areas: (this._config.filter_areas || []).join(', '),
      collapse_details: this._config.collapse_details !== undefined ? this._config.collapse_details : true,
      show_details: this._config.show_details !== undefined ? this._config.show_details : true,
      tap_action: this._config.tap_action || {},
      double_tap_action: this._config.double_tap_action || {},
      hold_action: this._config.hold_action || {},
    };

    const allowed = ['area','type','severity','sent'];
    const currentOrder = (this._config.meta_order && Array.isArray(this._config.meta_order) && this._config.meta_order.length)
      ? this._config.meta_order.filter((k) => allowed.includes(k))
      : ['area','type','severity','sent'];
    const filledOrder = [...currentOrder, ...allowed.filter((k) => !currentOrder.includes(k))];

    const schemaTop = schema.filter((s) => !['tap_action','double_tap_action','hold_action'].includes(s.name));
    const schemaActions = schema.filter((s) => ['tap_action','double_tap_action','hold_action'].includes(s.name));

    return html`
      <div class="container">
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schemaTop}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
        <div class="meta-fields">
          ${filledOrder.map((key, index) => html`
            <ha-settings-row class="meta-row">
              <span slot="heading">${this._labelForMeta(key)}</span>
              <span slot="description"></span>
              <div class="order-actions">
                <mwc-icon-button @click=${() => this._moveMeta(key, -1)} .disabled=${index === 0} aria-label="Move up">
                  <ha-icon icon="mdi:chevron-up"></ha-icon>
                </mwc-icon-button>
                <mwc-icon-button @click=${() => this._moveMeta(key, 1)} .disabled=${index === filledOrder.length - 1} aria-label="Move down">
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </mwc-icon-button>
              </div>
              <ha-switch
                .checked=${this._isMetaShown(key)}
                @change=${(e) => this._toggleMeta(key, e)}
              ></ha-switch>
            </ha-settings-row>
          `)}
        </div>
        <ha-form
          .hass=${this.hass}
          .data=${data}
          .schema=${schemaActions}
          .computeLabel=${this._computeLabel}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;
  }

  _valueChanged = (ev) => {
    if (!this._config || !this.hass) return;
    const value = ev.detail?.value || {};
    const next = { ...this._config, ...value };
    if (typeof next.filter_areas === 'string') {
      next.filter_areas = next.filter_areas
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next } }));
  };

  _isMetaShown(key) {
    if (key === 'area') return this._config.show_area !== false;
    if (key === 'type') return this._config.show_type !== false;
    if (key === 'severity') return this._config.show_severity !== false;
    if (key === 'sent') return this._config.show_sent !== false;
    return true;
  }

  _toggleMeta(key, ev) {
    const on = ev?.target?.checked ?? true;
    let next;
    if (key === 'area') next = { ...this._config, show_area: on };
    else if (key === 'type') next = { ...this._config, show_type: on };
    else if (key === 'severity') next = { ...this._config, show_severity: on };
    else if (key === 'sent') next = { ...this._config, show_sent: on };
    else next = { ...this._config };
    this._config = next;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: next } }));
  }

  _moveMeta(key, delta) {
    const allowed = ['area','type','severity','sent'];
    const order = (this._config.meta_order && Array.isArray(this._config.meta_order))
      ? this._config.meta_order.filter((k) => allowed.includes(k))
      : ['area','type','severity','sent'];
    const idx = order.indexOf(key);
    if (idx < 0) return;
    const newIdx = Math.max(0, Math.min(order.length - 1, idx + delta));
    if (newIdx === idx) return;
    const next = [...order];
    next.splice(idx, 1);
    next.splice(newIdx, 0, key);
    this._config = { ...this._config, meta_order: next };
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
  }

  _labelForMeta(key) {
    const map = { area: 'Area', type: 'Type', severity: 'Severity', sent: 'Sent' };
    return map[key] || key;
  }

  _computeLabel = (schema) => {
    const labels = {
      entity: 'Entity',
      title: 'Title',
      show_header: 'Show header',
      show_icon: 'Show icon',
      severity_background: 'Severity background',
      icon: 'Icon',
      icon_color: 'Icon color',
      hide_when_empty: 'Hide when empty',
      max_items: 'Max items',
      sort_order: 'Sort order',
      group_by: 'Group by',
      filter_severities: 'Filter severities',
      filter_areas: 'Filter areas (comma-separated)',
      collapse_details: 'Collapse details',
      show_area: 'Show area',
      show_type: 'Show type',
      show_severity: 'Show severity',
      show_sent: 'Show sent',
      show_details: 'Show details',
      tap_action: 'Tap action',
      double_tap_action: 'Double tap action',
      hold_action: 'Hold action',
    };
    return labels[schema.name] || schema.name;
  };
}

if (!customElements.get('krisinformation-alert-card-editor')) {
  customElements.define('krisinformation-alert-card-editor', KrisinformationAlertCardEditor);
}

// Register the card so it appears in the "Add card" dialog
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'krisinformation-alert-card',
  name: 'Krisinformation Alert Card',
  description: 'Displays Krisinformation alerts using the Krisinformation integration with configurable attributes',
  preview: true,
});

// Actions support (same behavior as SMHI card)
KrisinformationAlertCard.prototype._onRowAction = function (e, item) {
  const tag = (e.composedPath?.()[0]?.tagName || '').toLowerCase();
  if (tag === 'ha-markdown' || (e.target && e.target.classList && e.target.classList.contains('details-toggle'))) {
    return;
  }
  const action = this.config?.tap_action || { action: 'more-info' };
  this._runAction(action, item);
};

KrisinformationAlertCard.prototype._onKeydown = function (e, item) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    const action = this.config?.tap_action || { action: 'more-info' };
    this._runAction(action, item);
  }
};

KrisinformationAlertCard.prototype._runAction = function (action, item) {
  const a = action?.action || 'more-info';
  if (a === 'none') return;
  if (a === 'more-info') {
    const ev = new CustomEvent('hass-more-info', { bubbles: true, composed: true, detail: { entityId: this.config.entity } });
    this.dispatchEvent(ev);
    return;
  }
  if (a === 'navigate' && action.navigation_path) {
    history.pushState(null, '', action.navigation_path);
    const ev = new Event('location-changed', { bubbles: true, composed: true });
    this.dispatchEvent(ev);
    return;
  }
  if (a === 'url' && action.url_path) {
    window.open(action.url_path, '_blank');
    return;
  }
  if (a === 'call-service' && action.service) {
    const [domain, service] = action.service.split('.');
    this.hass.callService(domain, service, action.service_data || {});
    return;
  }
};
