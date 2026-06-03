(function(){
	// Attach ripple effect to buttons and elements with data-ripple
	function createRipple(e){
		const target = e.currentTarget;
		const rect = target.getBoundingClientRect();
		const circle = document.createElement('span');
		const diameter = Math.max(rect.width, rect.height);
		const radius = diameter / 2;

		circle.style.width = circle.style.height = `${diameter}px`;
		circle.style.left = `${e.clientX - rect.left - radius}px`;
		circle.style.top = `${e.clientY - rect.top - radius}px`;
		circle.classList.add('ripple-effect');

		const existing = target.getElementsByClassName('ripple-effect')[0];
		if(existing){ existing.remove(); }

		target.appendChild(circle);

		// remove after animation
		setTimeout(() => { circle.remove(); }, 600);
	}

	function attachRipples(){
		const selectors = ['.btn', '.nav-btn', '.download-btn', '.template-btn', '.section-box button', 'button'];
		const els = document.querySelectorAll(selectors.join(','));
		els.forEach(el => {
			// don't attach twice
			if(el.__rippleAttached) return;
			el.addEventListener('click', createRipple);
			el.__rippleAttached = true;
		});
	}

	// subtle float animation for template buttons
	function floatTemplates(){
		const t = document.querySelectorAll('.template-btn');
		t.forEach((btn, i) => {
			btn.style.transitionDelay = `${i * 40}ms`;
			btn.addEventListener('mouseenter', () => btn.classList.add('template-hover'));
			btn.addEventListener('mouseleave', () => btn.classList.remove('template-hover'));
		});
	}

	document.addEventListener('DOMContentLoaded', () => {
		attachRipples();
		floatTemplates();
	});
})();

/* Additional micro interactions: tooltips, back-to-top, smooth scroll */
(function(){
	function showTooltip(e){
		const text = e.currentTarget.dataset.tooltip;
		if(!text) return;
		const tip = document.createElement('div');
		tip.className = 'micro-tooltip';
		tip.textContent = text;
		document.body.appendChild(tip);
		const rect = e.currentTarget.getBoundingClientRect();
		tip.style.left = `${rect.left + rect.width/2 - tip.offsetWidth/2}px`;
		tip.style.top = `${rect.top - tip.offsetHeight - 8}px`;
		e.currentTarget.__tooltip = tip;
	}

	function hideTooltip(e){
		const tip = e.currentTarget.__tooltip;
		if(tip){ tip.remove(); e.currentTarget.__tooltip = null; }
	}

	function attachTooltips(){
		const els = document.querySelectorAll('[data-tooltip]');
		els.forEach(el=>{
			el.addEventListener('mouseenter', showTooltip);
			el.addEventListener('mouseleave', hideTooltip);
			el.addEventListener('focus', showTooltip);
			el.addEventListener('blur', hideTooltip);
		});
	}

	const backToTop = document.getElementById('backToTop');
	function handleScroll(){
		if(!backToTop) return;
		if(window.scrollY > 300) backToTop.classList.add('visible');
		else backToTop.classList.remove('visible');
	}

	function scrollToTop(){ window.scrollTo({top:0, behavior:'smooth'}); }

	document.addEventListener('DOMContentLoaded', () => {
		attachTooltips();
		handleScroll();
		window.addEventListener('scroll', handleScroll);
		if(backToTop) backToTop.addEventListener('click', scrollToTop);

		// smooth anchor links
		document.querySelectorAll('a[href^="#"]').forEach(a => {
			a.addEventListener('click', function(e){
				const targetId = this.getAttribute('href').slice(1);
				const target = document.getElementById(targetId);
				if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth'}); }
			});
		});
	});

})();

