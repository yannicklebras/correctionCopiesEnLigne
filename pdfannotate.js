/**

 * PDFAnnotate v1.0.0
 * Author: Ravisha Heshan
 */

var PDFAnnotate = function(container_id, url, options = {},annotations) {
	//alert("attention");
	//alert(annotations);
	this.number_of_pages = 0;
	this.pages_rendered = 0;
	this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle
	this.currentZoom = 1;
	this.fabricObjects = [];
	this.fabricObjectsData = [];
	this.color = '#FF0000';
	this.borderColor = '#000000';
	this.borderSize = 2;
	this.font_size = 16;
	this.active_canvas = 0;
	this.container_id = container_id;
	this.url = url;
	var inst = this;

	var loadingTask = PDFJS.getDocument(this.url);
	loadingTask.promise.then(function (pdf) {

	    var scale = 1.5;
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
	        $(fabricObj.upperCanvasEl).on('pointerdown',function (event) {
	            //event.preventDefault();
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
		    smiley="tampons/smile.png";
		} else if (inst.type=="frown-o") {
		    smiley="tampons/frown.png";
		} else if (inst.type=="check") {
		    smiley="tampons/checkmark.png";
		} else if (inst.type=="cross") {
		    smiley="tampons/redcross.png";
		}
	        var text = new fabric.Image.fromURL(smiley,function(image){
	            image.set({left: posx-25,
	            top: posy -25,
	            selectable: true});
		    image.scaleToWidth(50);
		    fabricObj.add(image);
	        });
//	        inst.active_tool = 0;
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




PDFAnnotate.prototype.baremeToPdf= function(bareme,total,pdf) {
	var pageWidth = 8.27,
  		lineHeight = 1.2,
  		margin = 0.5,
  		maxLineWidth = pageWidth - margin * 2,
  		fontSize = 12,
  		ptsPerInch = 72,
  		oneLineHeight = (fontSize * lineHeight) / ptsPerInch;
	var lineSpacing=14;
	var nomDS = bareme.find("#nomDS").val();
	var dateDS = bareme.find("#dateDS").val();
	var classeDS = bareme.find("#classeDS").val();
	var nomEleve = bareme.find("#nomEleve").val();
	var prenomEleve = bareme.find("#prenomEleve").val();
	var appreciation = total.find("#appreciation").val();
	var note = total.find("#total").val()+"/"+total.find("#maximum").val();
	pdf.setFontSize(15);
	pdf.text(nomEleve+" "+prenomEleve,pdf.internal.pageSize.width/2,20,'center');
	var textGeneral = "Note : "+note+"\nAppréciation : "+appreciation+"\n";
	pdf.setFontSize(fontSize);
	pdf.setLineHeightFactor(lineHeight);
	//textGeneral = pdf.splitTextToSize(textGeneral,pdf.internal.pageSize.width-20)
	//pdf.text(textGeneral,10,30);
	var textHeight = addWrappedText({text:textGeneral,textWidth:pdf.internal.pageSize.width-20,doc:pdf,fontSize:fontSize,lineSpacing:lineSpacing,xPosition:10,initialYPosition:40});
	pdf.line(0,textHeight-0.5*lineSpacing,pdf.internal.pageSize.width,textHeight-0.5*lineSpacing);
	pdf.line(0,textHeight-0.4*lineSpacing,pdf.internal.pageSize.width,textHeight-0.4*lineSpacing);
	textHeight += lineSpacing;
	var questions = $("#bareme").find(".bloc_question")

	for (bloc_question of questions) {
		var numero = $(bloc_question).find(".numeroQuestion").text();
		var commentaire = $(bloc_question).find(".commentaire").val();
		textHeight = addWrappedText({text:"Question "+numero+" : "+commentaire,textWidth:pdf.internal.pageSize.width-20,doc:pdf,fontSize:fontSize,lineSpacing:lineSpacing,xPosition:10,initialYPosition:textHeight+0.5*lineSpacing});
		textHeight += lineSpacing;
		var items = $(bloc_question).find(".itemsnotation");
		for (item of items) {
			var note = $(item).find(".range").val();
			var maxi = $(item).find(".maxi").val();
			var description = $(item).find(".descript").val();
			var widthscore = pdf.getTextWidth(note+"/"+maxi);
			var widthdescription = pdf.getTextWidth(description+" : ");
			var points = "";
			var altern = true;
			while (pdf.getTextWidth(points)<pdf.internal.pageSize.width-40-widthscore-widthdescription) {
				if (altern) 
				    points+="."
				else 
				    points+=" "
				altern = !altern;
			}
			textHeight = addWrappedText({text:description+" : "+points+note+"/"+maxi,textWidth:pdf.internal.pageSize.width-20,doc:pdf,fontSize:fontSize,lineSpacing:lineSpacing,xPosition:20,initialYPosition:textHeight});
			textHeight += lineSpacing;
		}
		pdf.line(0,textHeight-0.5*lineSpacing,pdf.internal.pageSize.width,textHeight-0.5*lineSpacing);
		textHeight +=lineSpacing*0.5;
	};

}





PDFAnnotate.prototype.savePdf = function () {
	var inst = this;
	var ancZoom = inst.currentZoom;
	inst.zoom(10*(1-inst.currentZoom));
	var doc = new jsPDF("p","pt","a4");
	inst.baremeToPdf($("#bareme"),$("#totalenvoi"),doc);
	$.each(inst.fabricObjects, function (index, fabricObj) {
	    if (index != -1) {
	        doc.addPage([fabricObj.width/1.33333333333,fabricObj.height/1.3333333333]); //1.3 permet de passer des pixels aux pts
//	        doc.setPage(index + 2);
	    }

	    doc.addImage(fabricObj.toDataURL({format:'jpeg',quality:0.95,scale:1/inst.currentZoom}), 'jpg', 0, 0);
	});
	doc.save('CopieAnnotee.pdf');
	inst.zoom(10*(ancZoom-1));
//	}
//	});
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
	var ancZoom=inst.currentZoom;
	inst.zoom(10*(1-inst.currentZoom));
	jsonbase["annotations"]=inst.fabricObjects;
	inst.zoom(10*(ancZoom-1));
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

