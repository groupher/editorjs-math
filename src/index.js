/**
 * Build styles
 */
require('./index.css').toString();
const load = require('./loadScript');
load('./tex-svg.js', 'mathJS');
load('./math.min.js', 'mathJax');

/**
 * Math Block for the Editor.js.
 * Render Tex syntax/plain text to pretty math equations
 *
 * @author flaming-cl
 * @license The MIT License (MIT)
 */

/**
 * @typedef {Object} MathData
 * @description Tool's input and output data format
 * @property {String} text — Math's content. Can include HTML tags: <a><b><i>
 */
class Math {
  /**
   * Default placeholder for Math Tool
   *
   * @return {string}
   * @constructor
   */
  static get DEFAULT_PLACEHOLDER() {
    return '';
  }

  /**
   * Render plugin`s main Element and fill it with saved data
   *
   * @param {{data: MathData, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   */
  constructor({data, config, api}) {
    this.api = api;

    this._CSS = {
      block: this.api.styles.block,
      wrapper: 'ce-Math'
    };
    this.onKeyUp = this.onKeyUp.bind(this);

    this._placeholder = config.placeholder ? config.placeholder : Math.DEFAULT_PLACEHOLDER;
    this._data = {};
    this._element = this.drawView();

    this.data = data;
  }

  /**
   * Check if text content is empty and set empty string to inner html.
   * We need this because some browsers (e.g. Safari) insert <br> into empty contenteditanle elements
   *
   * @param {KeyboardEvent} e - key up event
   */
  onKeyUp(e) {
    this._element.contentEditable = `${!this.ifSVGRendered()}`;

    if (e.code !== 'Backspace' && e.code !== 'Delete') {
      return;
    }

    const {textContent} = this._element;

    if (textContent === '') {
      this._element.innerHTML = '';
    }
  }

  /**
   * Change block editing state - rendering SVG or being editable
   */
  onClick() {
    if (this.ifSVGRendered()) {
      this.enableEditing();
      return;
    }
    this.renderSVG();
  }

  /**
   * check if SVG node rendered
   * @returns Boolean
   */
  ifSVGRendered() {
    const hasTexContent = this._element.getElementsByTagName('svg');
    return hasTexContent.length > 0;
  }

  /**
   * switch the block to editable mode
   */
  enableEditing() {
    const textNode = document.createElement('div');
    textNode.contentEditable = true;
    textNode.innerHTML = this.data.text;
    this._element.innerHTML = textNode.outerHTML;
  }

  /**
   * Create Tool's view
   * @return {HTMLElement}
   * @private
   */
  drawView() {
    let div = document.createElement('DIV');

    div.classList.add(this._CSS.wrapper, this._CSS.block);
    div.contentEditable = true;
    div.dataset.placeholder = this._placeholder;

    div.addEventListener('keyup', this.onKeyUp);
    return div;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   * @public
   */
  render() {
    this.renderSVG();
    this._element.addEventListener('dblclick', () => this.onClick());
    return this._element;
  }

  /**
   * Return Tool's view
   * @returns {HTMLDivElement}
   */
  renderSVG() {
    this.data.text = this._element.innerText || this.data.text;
    this.mathNode = this.mathNode || document.createElement('img');
    this.getTexSyntax(this.mathNode);
    this.textToSVG(this.mathNode);
  }

  /**
   * parsing the current text to Tex syntax if it has not been transformed
   */
  getTexSyntax(mathNode) {
    if (!window.math) {
      return console.error('not initiated mathjs');
    }
    try {
      mathNode.innerHTML = window.math.parse(this.data.text).toTex({parenthesis: 'keep'});
    } catch (e) {
      mathNode.innerHTML = this.data.text;
    }
  }

  /**
   * parsing the current text to Tex syntax if it has not been transformed
   */
  textToSVG(mathNode) {
    if (!window.MathJax) {
      return console.error('not initiated mathJax');
    }
    const options = window.MathJax.getMetricsFor(mathNode, true);
    const texNode = window.MathJax.tex2svg(mathNode.innerText, options);
    const svgNode = texNode.getElementsByTagName('svg')[0];
    this._element.innerHTML = svgNode ? svgNode.outerHTML : this._element.innerHTML;
  }

  /**
   * content inside Math is unchangeable.
   * @param {MathData} data
   * @public
   */
  merge(data) {
    this.data = this.data;
  }

  /**
   * Validate Math block data:
   * - check for emptiness
   *
   * @param {MathData} savedData — data received after saving
   * @returns {boolean} false if saved data is not correct, otherwise true
   * @public
   */
  validate(savedData) {
    if (savedData.text.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * content inside Math is unchangeable
   * @param {HTMLDivElement} toolsContent - Math tools rendered view
   * @returns {MathData} - saved data
   * @public
   */
  save(toolsContent) {
    return {
      text: this.data.text
    };
  }

  /**
   * On paste callback fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    const data = {
      text: event.detail.data.innerHTML
    };

    this.data = data;
  }

  /**
   * Enable Conversion Toolbar. Math can be converted to/from other tools
   */
  static get conversionConfig() {
    return {
      export: 'text', // to convert Math to other block, use 'text' property of saved data
      import: 'text' // to covert other block's exported string to Math, fill 'text' property of tool data
    };
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      text: {
        br: true,
        svg: true
      }
    };
  }

  /**
   * Get current Tools`s data
   * @returns {MathData} Current data
   * @private
   */
  get data() {
    return this._data;
  }

  /**
   * Store data in plugin:
   * - at the this._data property
   * - at the HTML
   *
   * @param {MathData} data — data to set
   * @private
   */
  set data(data) {
    this._data = data || {};

    this._element.innerHTML = this._data.text || '';
  }

  /**
   * Used by Editor paste handling API.
   * Provides configuration to handle P tags.
   *
   * @returns {{tags: string[]}}
   */
  static get pasteConfig() {
    return {
      tags: [ 'P' ]
    };
  }

  /**
   * Icon and title for displaying at the Toolbox
   *
   * @return {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: require('./math-icon.svg').default,
      title: 'Text'
    };
  }
}

module.exports = Math;
