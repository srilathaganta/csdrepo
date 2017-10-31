(function (String) {

    var valueMatch = {
        'rgb(0,0,0)': { 'black': ' ', 'rgb(0,0,0)': ' ' },
        'rgba(0,0,0,0)': { 'transparent': ' ', 'rgba(0,0,0,0)': ' ' },
        '#ffffff': { 'transparent': ' ' },
        'transparent': { 'transparent': ' ' }
    },
        colorFromProbe = function (color) {
            color = color.toString();
            if (!color.match(/^#.+$|^[^0-9]+$/)) return color;
            //var probe = ($('moo_color_probe') || new Element('textarea', {
            //    'id': 'moo_color_probe',
            //    'styles': {
            //        'display': 'none',
            //        'color': 'transparent'
            //    }
            //}).inject(document.body, 'after'));
            //try { probe.setStyle('color', color) } catch (e) { return color } //IE throws an error instead of defaulting the style to some color or transparent when the value is unrecognized
            //var computed = (Browser.ie) ? ieColorToHex(probe) : (Browser.opera) ? probe.style.color : probe.getComputedStyle('color'),
            //    match = valueMatch[computed.replace(/ /g, '')];
            //probe.setStyle('color', 'transparent');
            if (color == 'transparent') return 'rgb(0, 0, 0)';
            return (computed == 'transparent' || match && !match[color.replace(/ /g, '')]) ? color : computed;
        },
        ieColorToHex = function (probe) { // Special IE mojo, thanks to Dean Edwards for the inspiration, his code used a pop-up window to test the color, I found you can simply use a textarea instead ;)
            var value = probe.set('value', '').createTextRange().queryCommandValue("ForeColor");
            value = (((value & 0x0000ff) << 16) | (value & 0x00ff00) | ((value & 0xff0000) >>> 16)).toString(16);
            return "#000000".slice(0, 7 - value.length) + value;
        };

  
    colorToRgb = function (cellcol) {
        
        var color = colorFromProbe(cellcol);
            return (color.charAt(0) == '#') ? color.hexToRgb() : color;
        },
        colorToHex = function (cellcol) {
            var color = colorFromProbe(cellcol);
            return (color.test('rgb')) ? color.rgbToHex() : color;
        }
   

})(String);