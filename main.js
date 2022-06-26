const FOCUSABLE_SELECTOR = [
	'a',
	'button',
	'input',
	'select',
	'textarea',
	'[tabindex]:not([tabindex="-1"])'
]
	.map(selector => `${selector}:not(:disabled)`)
	.join(',');

function mod(a, b) {
	return ((a % b) + b) % b;
}

class ArrowFocus extends HTMLElement {
	set tolerance(value) {
		this.setAttribute('tolerance', value);
	}

	get tolerance() {
		if (this.hasAttribute('tolerance')) {
			return parseFloat(this.getAttribute('tolerance'));
		} else {
			return 10;
		}
	}

	constructor() {
		super(...arguments);

		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = `
			<style>:host { display: contents; }</style>
			<slot></slot>
		`;
	}

	connectedCallback() {
		this.addEventListener('keydown', this.handleKeydown);
	}

	disconnectedCallback() {
		this.removeEventListener('keydown', this.handleKeydown);
	}

	handleKeydown(event) {
		if (document.activeElement && event.key.startsWith('Arrow')) {
			const direction = event.key.slice('Arrow'.length).toLowerCase();
			const newlyFocused = this.handleArrowKey(document.activeElement, direction);

			if (newlyFocused) {
				event.preventDefault();
			}
		}
	}

	handleArrowKey(element, direction) {
		const focusableElements = this.getFocusableElements();
		const [sourceX, sourceY] = this.getStartingPoint(element, direction);
		const angle = this.getAngle(direction);
		const filteredElements = this.findElementsAlongAngle(focusableElements, angle, [sourceX, sourceY], element);
		const sortedElements = this.sortElementsByDistance(filteredElements, [sourceX, sourceY]);

		const projectionEvent = new CustomEvent('project', {
			bubbles: true,
			cancelable: true,
			detail: sortedElements
		});

		this.dispatchEvent(projectionEvent);

		if (sortedElements.length !== 0 && !projectionEvent.defaultPrevented) {
			let target = sortedElements[0];

			if (target.tagName === 'LABEL') {
				target = this.getLabeledControl(target);
			}

			target.focus();
			return target;
		} else {
			return null;
		}
	}

	getStartingPoint(element, direction) {
		const MARGIN = 1.5;

		const r = element.getBoundingClientRect();

		return {
			up: [r.left + r.width / 2, r.top + r.height - MARGIN],
			down: [r.left + r.width / 2, r.top + MARGIN],
			left: [r.left + r.width - MARGIN, r.top + r.height / 2],
			right: [r.left + MARGIN, r.top + r.height / 2]
		}[direction];
	}

	getAngle(direction) {
		return {
			right: 0,
			up: 90,
			left: 180,
			down: 270
		}[direction];
	}

	getLabeledControl(label) {
		if (label.htmlFor) {
			return document.getElementById(label.htmlFor);
		} else {
			return label.querySelector(FOCUSABLE_SELECTOR);
		}
	}

	getFocusableElements() {
		const focusableElements = Array.from(this.querySelectorAll(FOCUSABLE_SELECTOR));

		const labels = Array.from(this.querySelectorAll('label')).filter(label => {
			return this.getLabeledControl(label).matches(FOCUSABLE_SELECTOR);
		});

		focusableElements.push(...labels);

		const activeElementIndex = focusableElements.indexOf(document.activeElement);

		if (activeElementIndex !== -1) {
			focusableElements.splice(activeElementIndex, 1);
		}

		return focusableElements;
	}

	findElementsAlongAngle(elements, offsetAngle, [sourceX, sourceY], skipElement) {
		return elements.filter(element => {
			if (element.tagName === 'LABEL' && this.getLabeledControl(element) === skipElement) {
				return false;
			}

			const rect = element.getBoundingClientRect();

			const corners = [
				[rect.left, rect.top],
				[rect.left + rect.width, rect.top],
				[rect.left + rect.width, rect.top + rect.height],
				[rect.left, rect.top + rect.height]
			];

			const cornerAngles = corners.map(([x, y]) => {
				const theta = Math.atan2(sourceY - y, x - sourceX) * 180 / Math.PI;
				return mod((theta > 0 ? theta : theta + 360) - offsetAngle, 360);
			});

			const outOfBounds = cornerAngles.every(a => a > 90 && a < 270) ||
				cornerAngles.every(a => a > this.tolerance / 2 && a < 180) ||
				cornerAngles.every(a => a > 180 && a < 360 - this.tolerance / 2);

			return !outOfBounds;
		});
	}

	sortElementsByDistance(elements, [sourceX, sourceY]) {
		return elements.sort((el1, el2) => {
			const rect1 = el1.getBoundingClientRect();
			const x1 = rect1.left + rect1.width / 2;
			const y1 = rect1.top + rect1.height / 2;
			const d1 = Math.sqrt((x1 - sourceX) ** 2 + (y1 - sourceY) ** 2);

			const rect2 = el2.getBoundingClientRect();
			const x2 = rect2.left + rect2.width / 2;
			const y2 = rect2.top + rect2.height / 2;
			const d2 = Math.sqrt((x2 - sourceX) ** 2 + (y2 - sourceY) ** 2);

			return d1 - d2;
		});
	}
}

export default ArrowFocus;
