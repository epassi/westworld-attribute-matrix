let $configMenu;

let _chart = {};
let _config = 0;

let init = () => {
	$(document).ready(() => {
		$configMenu = $(`.config-menu`);

		// Get host profile and create the chart.
		$.getJSON("resources/data/host-profile.json", (hostProfile) => {
			_chart = new RadarChart(`.chart`, hostProfile);

			// Create config selector.
			for (let [index, config] of _chart.configs.entries()) {
				$configMenu.append(`
					<div class="config" id="config-${index}">
						<div class="content">
							<h1 class="id">${config.id}</h1>
							<p class="name">${config.name}</p>
						</div>
					</div>
				`);

				let $configItem = $(`#config-${index}`);
				$configItem.click(event => {
					changeConfig(index);
				});
			}

			// Set initial config.
			// Create delay for more dramatic intro.
			setTimeout(() => {
				changeConfig(0);
			}, 1000);

			// Deselect the current config when sliders are adjusted by user.
			_chart.$chart.on(AttributeSlider.SLIDE_EVENT, event => {
				changeConfig();
				let $configItem = $(`#config-${_config}`);
				$configItem.removeClass(`is-active`);

			});
		});
		
	});
}

let changeConfig = config => {
	let $configItem = $(`#config-${_config}`);
	let $newConfigItem = $(`#config-${config}`);

	// If sliders are moved manually,
	// deselect the configuration.
	if (config === undefined) {
		$configItem.removeClass(`is-active`);
		return;
	}

	$configItem.removeClass(`is-active`);
	$newConfigItem.addClass(`is-active`);

	_config = config;
	_chart.config = config;
} 

init();