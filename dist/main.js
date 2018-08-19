'use strict';

var colorThreshold = 15,
    imageInfo = null,
    tempCanvas = null,
    cacheInd = null,
    delResData = null,
    predelResData = null,
    mask = null,
    downPoint = null,
    allowDraw = false,
    currentThreshold = colorThreshold,
    scaleStep = 0.1,
    newScale = 1,
    minScale = 0.5,
    maxScale = 3,
    hatchLength = 4,
    hatchOffset = 0;

window.onload = function () {
	var imgConetent = document.getElementById('content');
	imgConetent.style.maxWidth = window.innerWidth + 'px';
	imgConetent.style.maxHeight = window.innerHeight + 'px';

	EventInit();
	setInterval(function () {
		hatchTick();
	}, 300);
};

function EventInit() {
	//Init MouseWheel Event
	var content = document.getElementById('content');
	content.addEventListener('mousewheel', handleMouseWheel);

	document.getElementById('filePicker').addEventListener('click', function () {
		document.getElementById('file-upload').click();
	});

	//Drag Add Image
	var dropContainer = document.querySelector('#dndArea');

	dropContainer.addEventListener('dragover', function (e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'link';
		if (!dropContainer.classList.contains('uploaderOver')) dropContainer.classList.add('uploaderOver');
	}, false);

	dropContainer.addEventListener('dragleave', function () {
		dropContainer.classList.remove('uploaderOver');
	}, false);

	dropContainer.addEventListener('drop', function (e) {
		e.stopPropagation();
		e.preventDefault();
		var reader = new FileReader();
		//validate
		var ext = e.dataTransfer.files[0].name.substring(e.dataTransfer.files[0].name.lastIndexOf('.') + 1).toLowerCase();
		if (ext != 'png' && ext != 'jpg' && ext != 'jpeg') {
			alert('图片的格式必须为png或者jpg或者jpeg格式！');
			return;
		}
		reader.onload = function (e) {
			var src = e.target.result;
			var img = document.getElementById('test-picture');
			img.setAttribute('src', src);
			img.onload = function () {
				window.initCanvas(img);
				//Jquery
				$('#uImgWrapper').fadeOut('400', function () {
					$('#wrapper').fadeIn('400');
					$('#panel').fadeIn('400');
				});
			};
			dropContainer.classList.remove('uploaderOver');
		};
		reader.readAsDataURL(e.dataTransfer.files[0]);
	}, false);

	document.onkeydown = function (e) {
		// Revoke (command+Z or ctrl+Z)
		if (e.metaKey && e.keyCode === 90 || e.ctrlKey && e.keyCode === 90) {
			e.preventDefault();
			if (mask && mask.data.length && mask.predata.length) {
				if (!predelResData) {
					var _ref = [mask.predata, mask.data];
					mask.data = _ref[0];
					mask.predata = _ref[1];
				} else if (predelResData) {
					delResData = predelResData;
					predelResData = null;
				}
				drawBorder();
			}
		}
		//Reset
		if (e.metaKey && e.keyCode === 68 || e.ctrlKey && e.keyCode === 68) {
			e.preventDefault();
			if (mask) {
				var _ref2 = [[], mask.data];
				mask.data = _ref2[0];
				mask.predata = _ref2[1];

				delResData = null;
				predelResData = null;
				MagicWand.clearPreData();
				drawBorder();
			}
		}

		//Delete
		if (e.metaKey && e.keyCode === 46 || e.metaKey && e.keyCode === 8 || e.ctrlKey && e.keyCode === 46 || e.ctrlKey && e.keyCode === 8) {
			e.preventDefault();
			if (mask) {
				drawBorder(null, true);
			}
		}
		//Add colorThreshold
		if (e.keyCode === 87) {
			//W
			e.preventDefault();
			var _colorThreshold = document.getElementById('colorThreshold').value;
			if (parseInt(_colorThreshold, 10) < 442) _colorThreshold = parseInt(_colorThreshold, 10) + 1;
		}
		//reduce colorThreshold
		if (e.keyCode == 83) {
			//S
			e.preventDefault();
			var _colorThreshold2 = document.getElementById('colorThreshold').value;
			if (parseInt(_colorThreshold2, 10) > 0) _colorThreshold2 = parseInt(_colorThreshold2, 10) - 1;
		}
	};
}

function initCanvas(img) {
	maxScale = window.innerWidth / document.getElementById('test-picture').width + 2;
	var imgTemp = new Image();
	imgTemp.src = img.src;
	var cvs = document.getElementById('canvas'),
	    imgContain = document.getElementById('test-picture'),
	    sh = imgTemp.height / (imgTemp.width / imgContain.width);
	cvs.width = imgContain.width;
	cvs.height = sh;
	//getImageData pass to Magicwands
	imageInfo = {
		width: imgContain.width,
		height: sh,
		context: cvs.getContext('2d')
	};
	mask = null;
	//this canvas use for save source image data and export
	tempCanvas = document.createElement('canvas');
	var tempCtx = tempCanvas.getContext('2d');
	tempCtx.canvas.width = imageInfo.width;
	tempCtx.canvas.height = imageInfo.height;
	tempCtx.drawImage(img, 0, 0, imageInfo.width, imageInfo.height);
	imageInfo.data = tempCtx.getImageData(0, 0, imageInfo.width, imageInfo.height);
}

function imgChange(inp) {
	if (inp.files && inp.files[0]) {
		var reader = new FileReader();
		reader.onload = function (e) {
			var src = e.target.result;
			var img = document.getElementById('test-picture');
			img.setAttribute('src', src);
			img.onload = function () {
				window.initCanvas(img);
				//Jquery 
				$('#uImgWrapper').fadeOut('400', function () {
					$('#wrapper').fadeIn('400');
					$('#panel').fadeIn('400');
				});
			};
		};
		reader.readAsDataURL(inp.files[0]);
	}
}

function getMousePosition(e) {
	//Jquery
	var p = $(e.target).offset(),
	    x = Math.round((e.clientX || e.pageX) - p.left),
	    //relative canvas
	y = Math.round((e.clientY || e.pageY) - p.top);
	return { x: x, y: y };
}

function onMouseDown(e) {
	if (e.button == 0) {
		//union
		allowDraw = true;
		downPoint = getMousePosition(e);
		colorThreshold = parseInt(document.getElementById('colorThreshold').value, 10) || 15;
		currentThreshold = colorThreshold;
		//reduction
		drawMask(parseInt(downPoint.x / newScale, 10), parseInt(downPoint.y / newScale), 10);
	} else {
		allowDraw = false;
	}
}

function onMouseMove(e) {
	if (allowDraw) {
		var p = getMousePosition(e);
		if (p.x != downPoint.x || p.y != downPoint.y) {
			var dx = p.x - downPoint.x,
			    dy = p.y - downPoint.y,
			    len = Math.sqrt(dx * dx + dy * dy),
			    sign = dy < 0 ? 1 / 10 : 1 / 2; //mouse move direction depend colorThreshold increase slow or quick(//TODO	subtract)
			var thres = Math.min(Math.max(colorThreshold + Math.floor(sign * len), 1), 255);
			if (thres != currentThreshold) {
				currentThreshold = thres;
				drawMask(parseInt(downPoint.x / newScale, 10), parseInt(downPoint.y / newScale), 10);
			}
		}
	}
}

function onMouseUp() {
	allowDraw = false;
	currentThreshold = colorThreshold;
}

function drawMask(x, y) {
	if (!imageInfo) return;
	var image = {
		data: imageInfo.data.data,
		width: imageInfo.width,
		height: imageInfo.height,
		bytes: 4
	};

	mask = MagicWand.floodFill(image, x, y, currentThreshold);
	drawBorder();
}

function hatchTick() {
	hatchOffset = (hatchOffset + 1) % (hatchLength * 2);
	drawBorder(true);
}

function drawBorder(noBorder, noFill) {
	if (!mask) return;
	var x = void 0,
	    y = void 0,
	    i = void 0,
	    j = void 0,
	    k = void 0,
	    w = imageInfo.width,
	    h = imageInfo.height,
	    ctx = imageInfo.context,
	    imgData = ctx.createImageData(w, h),
	    res = imgData.data;

	if (!noBorder) {
		cacheInd = MagicWand.getBorderIndices(mask); //cache
		predelResData = null;
	}

	ctx.clearRect(0, 0, w, h);

	var len = cacheInd.length;
	for (j = 0; j < len; j++) {
		i = cacheInd[j];
		x = i % w; // calc x by index
		y = (i - x) / w; // calc y by index
		k = (y * w + x) * 4;
		if ((x + y + hatchOffset) % (hatchLength * 2) < hatchLength) {
			// detect hatch color 
			res[k + 3] = 255; // black, change only alpha
		} else {
			res[k] = 255; // white
			res[k + 1] = 255;
			res[k + 2] = 255;
			res[k + 3] = 255;
		}
	}

	if (noFill) delResData = MagicWand.getCurrentResult(mask);
	if (delResData) {
		predelResData = null;
		for (j = 0; j < delResData.length; j++) {
			i = delResData[j];
			x = i % w; // calc x by index
			y = (i - x) / w; // calc y by index
			k = (y * w + x) * 4;
			res[k] = 255; // white
			res[k + 1] = 255;
			res[k + 2] = 255;
			res[k + 3] = 255;
		}
	}
	ctx.putImageData(imgData, 0, 0);
}

function imgToCanvas() {
	var x = void 0,
	    y = void 0,
	    i = void 0,
	    j = void 0,
	    k = void 0,
	    w = imageInfo.width,
	    h = imageInfo.height,
	    ctx = tempCanvas.getContext('2d'),
	    imageData = ctx.getImageData(0, 0, w, h),
	    res = imageData.data;
	var delResData = MagicWand.getCurrentResult(mask);
	if (delResData) {
		for (j = 0; j < delResData.length; j++) {
			i = delResData[j];
			x = i % w; // calc x by index
			y = (i - x) / w; // calc y by index
			k = (y * w + x) * 4;
			res[k] = 0; // white
			res[k + 1] = 0;
			res[k + 2] = 0;
			res[k + 3] = 0;
		}
	}
	ctx.putImageData(imageData, 0, 0);
}

function downloadImg(e) {
	// First try a.download, then web filesystem, then object URLs
	// just use a.download
	e.stopPropagation();
	imgToCanvas();
	tempCanvas.toBlob(function (blob) {
		var aTemp = document.createElement('a');
		aTemp.setAttribute('href', URL.createObjectURL(blob));
		aTemp.setAttribute('download', 'Magic.png');

		var evObj = document.createEvent('MouseEvents');
		evObj.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, true, false, 0, null);
		aTemp.dispatchEvent(evObj);
	});
}

function reloadImg() {
	//Jquery
	$('#wrapper').fadeOut('400', function () {
		$('#uImgWrapper').fadeIn('400');
		if (mask && mask.data) {
			;
			var _ref3 = [[], mask.data];
			mask.data = _ref3[0];
			mask.predata = _ref3[1];
		}delResData = null;
		predelResData = null;
		MagicWand.clearPreData();
	});
	$('#panel').fadeOut('400');
}

//TODO：完善 滚轮放大、空格拖拽（实现PS中的效果）
//滚轮放大：在scale小于1的情况下滚轮放大以中心为焦点进行放大，大于1后跟随鼠标位置进行放大
//空格拖拽：在放大的情况下，按住空格后对img、canvas的位置控制
function handleMouseWheel(e) {
	var wd = e.wheelDelta;
	newScale += wd > 0 ? scaleStep : -scaleStep;
	newScale = newScale < minScale ? minScale : newScale;
	newScale = newScale > maxScale ? maxScale : newScale;
	//img、canvas change need synchronization
	var imgContain = document.getElementById('test-picture'),
	    canvas = document.getElementById('canvas'),
	    content = document.getElementById('content');

	if (parseInt(canvas.width * newScale, 10) > window.innerWidth || parseInt(canvas.width * newScale, 10) > window.innerWidth) {
		imgContain.style.transformOrigin = 'left top';
		canvas.style.transformOrigin = 'left top';
		tempCanvas.style.transformOrigin = 'left top';
	} else {
		imgContain.style.transformOrigin = 'center center';
		canvas.style.transformOrigin = 'center center';
		tempCanvas.style.transformOrigin = 'center center';
	}
	imgContain.style.transform = 'scale(' + newScale + ')';
	canvas.style.transform = 'scale(' + newScale + ')';
	tempCanvas.style.transform = 'scale(' + newScale + ')';

	if (parseInt(canvas.width * newScale, 10) > window.innerWidth) {
		content.style.overflowX = 'scroll';
	} else if (parseInt(canvas.height * newScale, 10) > window.innerHeight) {
		content.style.overflowY = 'scroll';
	} else {
		content.style.overflow = 'hidden';
	}
}