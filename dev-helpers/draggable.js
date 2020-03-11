let globalZIndex = 0;

class Draggable extends HTMLElement {
	downEvent = null;
	downX = 0;
	downY = 0;

	constructor() {
		super(...arguments);

		this.attachShadow({ mode: 'open' });

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					--x: 0;
					--y: 0;
					background: white;
					border: 2px solid gray;
					border-radius: 2px;
					color: black;
					display: inline-block;
					position: relative;
					transform: translate(var(--x), var(--y));
				}

				#grab-bar {
					background: gray;
					cursor: move;
					height: 10px;
				}

				#content {
					padding: 0.3em;
				}
			</style>

			<div id="grab-bar"></div>

			<div id="content">
				<slot></slot>
			</div>
		`;

		this.grabBar = this.shadowRoot.getElementById('grab-bar');
	}

	connectedCallback() {
		this.grabBar.addEventListener('pointerdown', this.handlePointerDown);
	}

	disconnectedCallback() {
		this.grabBar.removeEventListener('pointerdown', this.handlePointerDown);
		removeEventListener('pointermove', this.handlePointerMove);
		removeEventListener('pointerup', this.handlePointerUp);
	}

	handlePointerDown = (event) => {
		event.preventDefault();

		const computedStyle = getComputedStyle(this);

		this.downEvent = event;
		this.downX = parseFloat(computedStyle.getPropertyValue('--x'));
		this.downY = parseFloat(computedStyle.getPropertyValue('--y'));

		if (parseFloat(this.style.zIndex) !== globalZIndex) {
			globalZIndex += 1
			this.style.zIndex = globalZIndex;
		}

		addEventListener('pointermove', this.handlePointerMove);
		addEventListener('pointerup', this.handlePointerUp);
	}

	handlePointerMove = (event) => {
		const dx = event.x - this.downEvent.x;
		const dy = event.y - this.downEvent.y;

		this.style.setProperty('--x', `${this.downX + dx}px`);
		this.style.setProperty('--y', `${this.downY + dy}px`);
	}

	handlePointerUp = () => {
		removeEventListener('pointermove', this.handlePointerMove);
		removeEventListener('pointerup', this.handlePointerUp);
	}
}

export default Draggable;
