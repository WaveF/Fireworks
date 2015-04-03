/* ===========================================================================

	filter.js

	Copyright 2013 John Dunning.  All rights reserved.
	fw@johndunning.com
	http://johndunning.com/fireworks

   ======================================================================== */


// ===========================================================================
define([
	"./state",
	"./base",
	"./container",
	"./color",
	"./regex",
	"fwlib/utils"
], function(
	state,
	base,
	Container,
	color,
	re,
	utils
) {
	const WhitespaceCommaRE = re.WhitespaceComma;
	var tag = base.tag;


	// =======================================================================
	tag("filter", Container, {
		Effects: {
			shadow: {
				EffectIsVisible: true,
				EffectMoaID: "{a7944db8-6ce2-11d1-8c76000502701850}",
				ShadowAngle: 315,
				ShadowBlur: 0,
				ShadowColor: "#000000",
				ShadowDistance: 1,
				ShadowType: 0,
				category: "Shadow and Glow",
				name: "Drop Shadow"
			},
			blur: {
				EffectIsVisible: true,
				EffectMoaID: "{d04ef8c0-71b3-11d1-8c8200a024cdc039}",
				MB_filter_preview_tile_size: "-1 -1",
				category: "Blur",
				gaussian_blur_radius: 1,
				name: "Gaussian Blur..."
			}
		},


		effect: null,
		feGaussianBlur: null,
		feOffset: null,
		feColorMatrix: null,


		onOpen: function()
		{
			// make this a noop, since we don't need to inherit attributes
		},


		onClose: function()
		{
			var blur = this.feGaussianBlur,
				offset = this.feOffset,
				sourceIsAlpha = blur && blur.node.attributes["in"] == "SourceAlpha",
				hasColorMatrix = this.feColorMatrix && this.feColorMatrix.node.attributes.type == "matrix";

			if (blur) {
				if (sourceIsAlpha || hasColorMatrix) {
					this.effect = utils.copyObject(this.Effects.shadow);
					this.effect.ShadowBlur = Math.round(blur.node.attributes.stdDeviation);

					if (offset) {
						var polar = this.convertToPolar(offset.node.attributes.dx,
							offset.node.attributes.dy);

							// add a little bit to the distance and then round, since
							// the radius of a 1,1 offset is 1.4, which FW would
							// round down to 1, which doesn't look right
						this.effect.ShadowDistance = Math.round(polar.r + .2);
						this.effect.ShadowAngle = polar.angle;
					}

					if (hasColorMatrix) {
						var values = this.feColorMatrix.node.attributes.values.split(WhitespaceCommaRE);
						this.effect.ShadowColor = color("#000000", parseFloat(values[18] || 1));
					}
				} else {
					this.effect = utils.copyObject(this.Effects.blur);
					this.effect.gaussian_blur_radius = blur.node.attributes.stdDeviation;
				}

				state.addDef(this.id, this);
			}
		},


		addChild: function(
			inChild)
		{
			this[inChild.type] = inChild;
		},


		apply: function()
		{
			this.dom.applyEffects({
				category:"UNUSED",
				effects:[this.effect],
				name:"UNUSED"
			});
		},


		convertToPolar: function(
			inX,
			inY)
		{
			return {
				r: Math.sqrt(inX * inX + inY * inY),
				angle: Math.atan(inX / -inY) * 180 / Math.PI
			};
		}
	});


	// =======================================================================
	var FilterEffect = tag({
		onOpen: function()
		{
			// make this a noop since we don't need to inherit attributes
		},


		onClose: function()
		{
			// make this a noop since there's nothing to render
		}
	});
	tag("feGaussianBlur", FilterEffect);
	tag("feOffset", FilterEffect);
	tag("feColorMatrix", FilterEffect);
});
