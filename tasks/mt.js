var system = require('system');
var page = require('webpage').create();
var address = 'input/' + system.args[1];
var arg2 = 400;
var size = [650, 3098];
var margin = 0;
// reset viewportSize
page.viewportSize = { width: size[0], height: size[1]};

function setSize(page, size) {
  var pageWidth = parseInt(size[0], 10);
  var pageHeight = parseInt(size[1], 10);
  page.viewportSize = { width: pageWidth, height: pageHeight };
  page.clipRect = { top: 0, left: 0, width: pageWidth, height: pageHeight };
}

function setClipRect(page, rect, margin, ratio) {
	var h = rect.height + margin*2;
	var w = rect.width + margin*2;
	if (w*ratio > h) {
    w = h / ratio;
  } else {
    h = w * ratio;
  }
	page.clipRect = { top: rect.top - margin, left: rect.left - margin, width: w, height: h };
}

var _getBoundingRect = function(selector) {
  return document.querySelector(selector).getBoundingClientRect();
};

page.open(address, function (status) {
    if (status !== 'success') {
      console.log('Unable to load the address!');
      phantom.exit();
    } else {
      var boundRect2 = page.evaluate(_getBoundingRect, 'body');
      var boundRect = {};
      boundRect.width = size[0];
      boundRect.left = 0;
      boundRect.top = boundRect2.top;
      boundRect.height= boundRect2.height;
      var ratio = boundRect.height/boundRect.width;
      setClipRect(page, boundRect, margin, boundRect.height/boundRect.width);
      b64s = page.renderBase64('PNG');
      var imgsize = [ arg2, Math.ceil(boundRect.height/boundRect.width * arg2) ];
      var imgcontent = '<html><body style="margin: 0; background: #fff;"><img src="data:image/png;base64,'+b64s+'" alt="N/A" width="'+imgsize[0]+'" height="'+imgsize[1]+'" /></body></html>';
      setSize(page, imgsize);
      page.content = imgcontent;
      page.onLoadFinished = function(status) {
        var filename = 'SIR/' + system.args[1].split('.')[0] + '.jpg';
        var res = page.render(filename);
        console.log('exiting');
        if (res) {
          phantom.exit();
        }
        else {
          phantom.exit(1);
        }
      }
    }
});