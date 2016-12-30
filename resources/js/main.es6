let $configMenu;

let _chart = {};

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
						<h1 class="id">${config.id}</h1>
						<p class="name">${config.name}</p>
					</div>
				`);

				$(`#config-${index}`).click(event => {
					// console.log(index);
					_chart.config = index;
				});
			}
		});
		
	});
}

init();