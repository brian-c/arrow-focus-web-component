class Badged extends HTMLElement {
	static get observedAttributes() {
		return ['label'];
	}

	set label(value) {
		if (value === null || value === undefined) {
			this.removeAttribute('label');
		} else {
			this.setAttribute('label', value);
		}
	}

	get label() {
		return this.getAttribute('label');
	}

	constructor() {
		super(...arguments);

		this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: contents;
				}

				#cap {
					position: relative;
				}

				#label {
					background: blueviolet;
					border-radius: 1.2em;
					display: inline-block;
					color: white;
					font: bold 0.6em/1.2em sans-serif;
					min-width: 1.2em;
					position: absolute;
					text-align: center;
					transform: translateX(-50%);
				}
			</style>

			<slot></slot><!--

			--><span id="cap">
				<span id="label"></span>
			</span>
		`;
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === 'label') {
			this.shadowRoot.getElementById('label').innerText = newValue;
		}
	}
}

export default Badged;
