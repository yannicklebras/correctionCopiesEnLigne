/**

 * PDFAnnotate v1.0.0
 * Author: Ravisha Heshan
 */

var PDFAnnotate = function(container_id, url, options = {},annotations) {
	//alert("attention");
	//alert(annotations);
	this.number_of_pages = 0;
	this.pages_rendered = 0;
	this.active_tool = 0; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle
	this.currentZoom = 1;
	this.fabricObjects = [];
	this.fabricObjectsData = [];
	this.color = '#212121';
	this.borderColor = '#000000';
	this.borderSize = 2;
	this.font_size = 16;
	this.active_canvas = 0;
	this.container_id = container_id;
	this.url = url;
	var inst = this;

	var loadingTask = PDFJS.getDocument(this.url);
	loadingTask.promise.then(function (pdf) {

	    var scale = 1;
	    inst.number_of_pages = pdf.pdfInfo.numPages;

	    for (var i = 1; i <= pdf.pdfInfo.numPages; i++) {
	        pdf.getPage(i).then(function (page) {
	            var viewport = page.getViewport(scale);
	            var canvas = document.createElement('canvas');
	            document.getElementById(inst.container_id).appendChild(canvas);
	            canvas.className = 'pdf-canvas';
	            canvas.height = viewport.height;
	            canvas.width = viewport.width;
	            context = canvas.getContext('2d');

	            var renderContext = {
	                canvasContext: context,
	                viewport: viewport
	            };
	            var renderTask = page.render(renderContext);
	            renderTask.then(function () {
	                $('.pdf-canvas').each(function (index, el) {
	                    $(el).attr('id', 'page-' + (index + 1) + '-canvas');
	                });
	                inst.pages_rendered++;
	                if (inst.pages_rendered == inst.number_of_pages) inst.initFabric(annotations);
	            });
	        });
	    }
	}, function (reason) {
	    console.error(reason);
	});

	this.initFabric = function (jsondata) {
		var inst = this;
	    $('#' + inst.container_id + ' canvas').each(function (index, el) {
	        var background = el.toDataURL("image/png");
	        var fabricObj = new fabric.Canvas(el.id, {
	            freeDrawingBrush: {
	                width: 1,
	                color: inst.color
	            }
	        });
			inst.fabricObjects.push(fabricObj);
			if (typeof options.onPageUpdated == 'function') {
				fabricObj.on('object:added', function() {
					var oldValue = Object.assign({}, inst.fabricObjectsData[index]);
					inst.fabricObjectsData[index] = fabricObj.toJSON()
					options.onPageUpdated(index + 1, oldValue, inst.fabricObjectsData[index]) 
				})
			}
	        fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
	        $(fabricObj.upperCanvasEl).click(function (event) {
	            inst.active_canvas = index;
	            inst.fabricClickHandler(event, fabricObj);
			});
			fabricObj.on('after:render', function () {
				inst.fabricObjectsData[index] = fabricObj.toJSON()
				fabricObj.off('after:render')
			})
		});
		inst.loadFromJSON(annotations);	
	}

	this.fabricClickHandler = function(event, fabricObj) {
		var inst = this;
		rect = fabricObj.upperCanvasEl.getBoundingClientRect();
		canvas = fabricObj.upperCanvasEl;
		var pointer = fabricObj.getPointer(event);
		var posx = pointer.x;
		var posy = pointer.y;
	    if (inst.active_tool == 5) {
		var smiley = "";
		if (inst.type=="smile-o") {
		    smiley="smile.png";
		} else if (inst.type=="frown-o") {
		    smiley="frown.png";
		}
	        var text = new fabric.Image.fromURL(smiley,function(image){
	            image.set({left: posx-25,
	            top: posy -25,
	            selectable: true});
		    image.scaleToWidth(50);
		    fabricObj.add(image);
	        });
	        inst.active_tool = 0;
            }
	    if (inst.active_tool == 2) {
	        var text = new fabric.IText('Sample text', {
	            left: posx,
	            top: posy,
	            fill: inst.color,
	            fontSize: inst.font_size,
	            selectable: true
	        });
	        fabricObj.add(text);
	        inst.active_tool = 0;

	    }
	}
}

PDFAnnotate.prototype.enableSelector = function () {
	var inst = this;
	inst.active_tool = 0;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
}

PDFAnnotate.prototype.enablePencil = function () {
	var inst = this;
	inst.active_tool = 1;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = true;
	    });
	}
}

PDFAnnotate.prototype.enableAddText = function () {
	var inst = this;
	inst.active_tool = 2;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
}

PDFAnnotate.prototype.enableStamp = function (type) {
	var inst = this;
	inst.active_tool = 5;
	inst.type = type;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
}

PDFAnnotate.prototype.enableRectangle = function () {
	var inst = this;
	var fabricObj = inst.fabricObjects[inst.active_canvas];
	inst.active_tool = 4;
	if (inst.fabricObjects.length > 0) {
		$.each(inst.fabricObjects, function (index, fabricObj) {
			fabricObj.isDrawingMode = false;
		});
	}

	var rect = new fabric.Rect({
		width: 100,
		height: 100,
		fill: inst.color,
		stroke: inst.borderColor,
		strokeSize: inst.borderSize
	});
	fabricObj.add(rect);
}



PDFAnnotate.prototype.enableAddArrow = function () {
	var inst = this;
	inst.active_tool = 3;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	        new Arrow(fabricObj, inst.color, function () {
	            inst.active_tool = 0;
	        });
	    });
	}
}

PDFAnnotate.prototype.deleteSelectedObject = function () {
	var inst = this;
	var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
	if (activeObject)
	{
	    if (confirm('Are you sure ?')) inst.fabricObjects[inst.active_canvas].remove(activeObject);
	}
}

PDFAnnotate.prototype.savePdf = function () {
	var inst = this;
	var doc = new jsPDF();
	var elementHandler = {
      		'#ignorePDF': function (element, renderer) {
        		return true;
      		}
    	};
	html2canvas($("#bareme")[0],{onrendered:function (bareme) {
	bareme.getContext("2d");
	var imgData = bareme.toDataURL("image/jpeg", 1.0);
	doc.addImage(imgData,"jpg",0,0);
	doc.addPage();
	$.each(inst.fabricObjects, function (index, fabricObj) {
	    if (index != 0) {
	        doc.addPage();
	        doc.setPage(index + 1);
	    }
	    doc.addImage(fabricObj.toDataURL({format:"jpeg",quality:0.9}), 'jpg', 0, 0);
	});
	doc.save('CopieAnnotee.pdf');
	}
	});
};


PDFAnnotate.prototype.saveJSON = function(){
	var inst = this;
	var fichierjson = this.makeJSON();
	var text = JSON.stringify(fichierjson,null,4);
	var name = "AnnotationsEtBareme.json";
	var type = "application/json";
	var file = new Blob([text], {type: type});
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        if (isIE)
        {
            window.navigator.msSaveOrOpenBlob(file, name);
        }
        else
        {
            var a = document.createElement('a');
            a.href = URL.createObjectURL(file);
            a.download = name;
            a.click();
        }

}



PDFAnnotate.prototype.makeJSON = function (){
	var inst = this;
	var jsonbase = {"nom":$("#bareme>#nomDS").val(),
			"date":$("#bareme>#dateDS").val(),
			"classe":$("#bareme>#classeDS").val(),
			"heure":$("#bareme>#heureDS").val(),
			"duree":$("#bareme>#dureeDS").val(),
			"nomEleve":$("#bareme>#donneesEleve").find("#nomEleve").val(),
			"prenomEleve":$("#bareme>#donneesEleve").find("#prenomEleve").val(),
			"corrige":true,
			"appreciation":$("#totalenvoi").find("#appreciation").val(),
			"bareme":[],
			"annotations":""};
	var jsonitem = {"description":"",
			"points":"",
			"pas":"",
			"note":"",
			"type":""};
	
	jsonbase["annotations"]=inst.fabricObjects;
	$(".bloc_question").each(function() {
		var bloc_question=this;
		var question = {"numero":"",
			"commentaire":"",
			"items":[]}; 
		question["numero"]=$(bloc_question).find(".numeroQuestion").text();
		question["commentaire"]=$(bloc_question).find(".commentaire").val();
		$(bloc_question).find(".itemsnotation").each(function() {
			var bloc_item = this;
			var description = $(bloc_item).find(".descript").val();
			var note = $(bloc_item).find(".range").val();
			var step = $(bloc_item).find(".step").val();
			var maxi = $(bloc_item).find(".maxi").val();
			var type = $(bloc_item).find(".type").val();
		        var item = {"description":description,
                        	"points":maxi,
                        	"pas":step,
                        	"note":note,
                        	"type":type};
			question["items"].push(item);
		});
		jsonbase["bareme"].push(question);
	});

//	alert(JSON.stringify(jsonbase,null,4));
	return jsonbase;

}


PDFAnnotate.prototype.setBrushSize = function (size) {
	var inst = this;
	$.each(inst.fabricObjects, function (index, fabricObj) {
	    fabricObj.freeDrawingBrush.width = parseInt(size);
	});
}

PDFAnnotate.prototype.setColor = function (color) {
	var inst = this;
	inst.color = color;
	$.each(inst.fabricObjects, function (index, fabricObj) {
        fabricObj.freeDrawingBrush.color = color;
    });
}

PDFAnnotate.prototype.setBorderColor = function (color) {
	var inst = this;
	inst.borderColor = color;
}

PDFAnnotate.prototype.setFontSize = function (size) {
	this.font_size = size;
}

PDFAnnotate.prototype.setBorderSize = function (size) {
	this.borderSize = size;
}

PDFAnnotate.prototype.clearActivePage = function () {
	var inst = this;
	var fabricObj = inst.fabricObjects[inst.active_canvas];
	var bg = fabricObj.backgroundImage;
	if (confirm('Are you sure?')) {
	    fabricObj.clear();
	    fabricObj.setBackgroundImage(bg, fabricObj.renderAll.bind(fabricObj));
	}
}

PDFAnnotate.prototype.zoom = function(factor) {
	var inst = this;
	var ancZoom = inst.currentZoom;
	var futZoom = ancZoom+factor*0.1;
	if (futZoom>0.05) {
		inst.currentZoom=futZoom;
		$.each(inst.fabricObjects,function(index,fabricObj) {
			fabricObj.setZoom(futZoom);
			fabricObj.setWidth(fabricObj.width*futZoom/ancZoom);
			fabricObj.setHeight(fabricObj.height*futZoom/ancZoom);
		});
	}
};

PDFAnnotate.prototype.serializePdf = function() {
	var inst = this;
	return JSON.stringify(inst.fabricObjects, null, 4);
}


PDFAnnotate.prototype.loadJSON = function() {
	var inst = this;
}


PDFAnnotate.prototype.loadFromJSON = function(jsonDataRaw) {
	var inst = this;
	jsonData = jsonDataRaw;
	//alert("hop");
	$.each(inst.fabricObjects, function (index, fabricObj) {
		//alert(jsonData.length);
		if (jsonData.length > index) {
			//alert("test");
			fabricObj.loadFromJSON(jsonData[index], function () {
				inst.fabricObjectsData[index] = fabricObj.toJSON()
			})
		}
	})
	$("#attendreModal").modal("hide");
}
