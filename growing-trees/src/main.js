function formatNumber(n) {
	var s = Math.round(n * 100) / 100;
	var r = "" + s;
	if (s - Math.round(s) == 0) {
		r += ".00";
	} else if (s*10 - Math.round(s*10) == 0) {
		r += "0";
	}
	if (Math.sign(s) + 1) {
		r = " " + r;
	}
	return r;
}

var mode;

var modeSelectContainer;
function changeModeFromEvent(ev) {
	mode = ev.target.value;
	ReactDOM.render(<ModeSelector currentMode={mode} />, modeSelectContainer);
}

var M3x3 = function(props) {
	var m = props.elements.map(formatNumber);
	return (<table>
		<tbody>
			<tr><td>{m[0]}</td><td>{m[1]}</td><td>{m[2]}</td></tr>
			<tr><td>{m[3]}</td><td>{m[4]}</td><td>{m[5]}</td></tr>
			<tr><td>{m[6]}</td><td>{m[7]}</td><td>{m[8]}</td></tr>
		</tbody>
	</table>);

}

var ModeSelector = function(props) {
	var currentMode = props.currentMode || 'rotate';
	return (<select value={currentMode} onChange={changeModeFromEvent}>
			<option value='rotate'>Rotation</option>
			<option value='scale'>Scale</option>
			<option value='translate'>Translation</option>
		</select>);
}

window.onload = function() {
	canviz.init();
	window.c = document.getElementById("render_target");
	window.ctx = canviz.instrument(c.getContext('2d'));

	var appContainer = document.getElementById("app_container");
	ReactDOM.render(<M3x3 elements={ctx.__currentState.transform} />, appContainer);

	modeSelectContainer = document.getElementById("mode_container");
	changeModeFromEvent({target: {value: 'rotate'}});


	var rect = c.getBoundingClientRect();

	startLoop(function(input) {



		if (input.mDown) {
			// ctx.save();
				canviz.clearOverlay(ctx);
				var d = [
					input.dMAt[X]/input.dT,
					input.dMAt[Y]/input.dT
				];
				switch(mode) {
					case 'rotate': {
						ctx.rotate(TAU*d[X]);
					} break;
					case 'scale': {
						d = sclV2(d, 5);
						ctx.scale(d[X], d[Y]);
					} break;
					case 'translate': {
						ctx.translate(input.dMAt[X], input.dMAt[Y]);
					} break;
				}


				canviz.drawGrid(ctx, 10, 10, 1);
				canviz.drawNormals(ctx, 10, 1);
				ReactDOM.render(<M3x3 elements={ctx.__currentState.transform} />, appContainer);
			
			// ctx.restore();

		}
	});
};