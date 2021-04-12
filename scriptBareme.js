
//$.getJSON("BaremeTest.json",function(json) {chargerJsonBareme(json)});







chargerJsonBareme = function(json){
	$("#bareme").empty();
	$("#bareme").append("<div id=\"nom\">"+json["nom"]+"</div>");
	$("#bareme").append("<fieldset id=\"donneesEleve\"></fieldset>");
	$("#bareme>#donneesEleve").append("<legend>Élève :</legend>");
	$("#bareme>#donneesEleve").append("<label>nom : <input id=\"nomEleve\" value=\""+json["nomEleve"]+"\"></label><br/>");
	$("#bareme>#donneesEleve").append("<label>prénom : <input id=\"prenomEleve\" value=\""+json["prenomEleve"]+"\"></label><br/>");
	$("#bareme").append("<input type=hidden id=\"nomDS\" value=\""+json["nom"]+"\">");
	$("#bareme").append("<input type=hidden id=\"dateDS\" value=\""+json["date"]+"\">");
	$("#bareme").append("<input type=hidden id=\"classeDS\" value=\""+json["classe"]+"\">");
	$("#bareme").append("<input type=hidden id=\"heureDS\" value=\""+json["heure"]+"\">");
	$("#bareme").append("<input type=hidden id=\"dureeDS\" value=\""+json["duree"]+"\">");
	var questions = json["bareme"];
	var maximum = 0;
	for (var question of questions) {
		var codeQuestion = "";
		codeQuestion+="<div class=\"bloc_question\"><p class=\"question\"><div class=\"recherche-page\"><i class=\"fa fa-hand-o-left\"></i></div><div class=\"titre-question\">&nbsp;Question&nbsp;:&nbsp;<div class=\"numeroQuestion\">"+question["numero"]+"</div></div></p>";
		codeQuestion+="<textarea class=\"commentaire\" placeholder=\"commentaire pour cette question\">"+question["commentaire"]+"</textarea>";
		for (var item of question["items"]) {
			codeQuestion+="<div class=\"itemsnotation\"><div class=\"description\">"+item["description"]+"</div><br/>";
			var note = item["note"];
			var step = item["pas"];
			var maxi = item["points"]
			maximum += +maxi;
			if (maxi=="manuel")
				codeQuestion+="<input type=\"text\" class=\"item manuel\" value=\""+note+"\">";
			else
				codeQuestion+="<input data-html2canvas-ignore=\”true\” type=\"range\" class=\"range\" \"min=\"0\" max=\""+maxi+"\" step=\""+step+"\" value=\""+note+"\"><output class=\"range_label\"></output>";
				codeQuestion+="/"+maxi;
			codeQuestion+="<input type=hidden value=\"\" class=\"position\">";
			codeQuestion+="<input type=hidden value=\""+item["description"]+"\" class=\"descript\">";
			codeQuestion+="<input type=hidden value=\""+step+"\" class=\"step\">";
			codeQuestion+="<input type=hidden value=\""+maxi+"\" class=\"maxi\">";
			codeQuestion+="<input type=hidden value=\""+item["type"]+"\" class=\"type\"></div>";

		}
		codeQuestion+="</div>";
		$("#bareme").append(codeQuestion);
	}
	$("#totalenvoi").append("<p><label>Total : <input type=text id=\"total\" class=\"total\"></label>/"+maximum+"<input type=hidden id=\"maximum\" value=\""+maximum+"\"<br/><textarea rows=\"5\" id=\"appreciation\" name=\"commentaireGeneral\" placeholder=\"Appréciation générale\">"+json["appreciation"]+"</textarea></p>");
	$(".recherche-page").on("mousedown",function() {
		var bloc=$(this).parent();
		var posScroll= $(bloc).find(".position").val();
		if (posScroll != "") {
			$("#pdf-container").scrollTop(posScroll);
		}
	});
	$(".bloc_question").find("*").on("change",function(){
		var bloc = $(this).parent();
		var scroll = $("#pdf-container").scrollTop();
		$(bloc).find(".position").val(scroll);
		$(bloc).find(".recherche-page").css("cursor","pointer");
	});
//mise à jour des points pour chaque range
$(function()
{
$('.range').on('input change', function(){
          $(this).next($('.range_label')).html(this.value);
        });
      $('.range_label').each(function(){
          var value = $(this).prev().attr('value');
          $(this).html(value);
        });
});


//mise à jour du total
$(function()
{
var sum=0;
$('.range').each(function() {
	sum += +$(this).val();
});
$(".total").val(sum);

$('.range').on('input change',function(){
	var sum=0;
	$('.range').each(function() {
		sum += +$(this).val();
	});
	$(".total").val(sum);
});
});

MathJax.typeset();
};

function ouvrirFichiers(event) {
	$("#pdf-container").empty();
	$("#bareme").empty();
	$("#totalenvoi").empty();
	$("#ouvrirModal").modal("hide");
        $("#attendreModal").modal({backdrop:"static",keyboard:false});
        $("#attendreModal .close").css("display","none");
	var fichierPDF = $("#ouvrirpdf").get(0).files[0];
	if ($("#ouvrirbareme").get(0).files.length==0) {


	};
	var fichierJSON = $("#ouvrirbareme").get(0).files[0];
	var fileReaderPDF = new FileReader();
  var fileReaderJSON = new FileReader();
	var contentJSON = "";
  fileReaderJSON.onload = function(e) {
          contentJSON = JSON.parse(e.target.result);
//		pdf.loadFromJSON(JSON.parse(contents));
//              chargerJsonBareme(JSON.parse(contents));
					$("#ouvrirModal").modal("hide");
	        fileReaderPDF.readAsArrayBuffer(fichierPDF);
       	};
	fileReaderPDF.onload = function() {
    		var typedarray = new Uint8Array(this.result);
		//alert(contentJSON["annotations"]);
		pdf = new PDFAnnotate('pdf-container', typedarray, {
					    onPageUpdated: (page, oldData, newData) => {
        					console.log(page, oldData, newData);
    						}
		},contentJSON["annotations"]);
		pdf.enablePencil();
		chargerJsonBareme(contentJSON);
		//alert("Truc");
	};
	fileReaderJSON.readAsText(fichierJSON);
}





function addWrappedText({text, textWidth, doc, fontSize = 10, fontType = 'normal', lineSpacing = 7, xPosition = 10, initialYPosition = 10, pageWrapInitialYPosition = 20}) {
  var textLines = doc.splitTextToSize(text, textWidth); // Split the text into lines
  var pageHeight = doc.internal.pageSize.height;        // Get page height, well use this for auto-paging
  doc.setFontType(fontType);
  doc.setFontSize(fontSize);

  var cursorY = initialYPosition;

  textLines.forEach(lineText => {
    if (cursorY > pageHeight) { // Auto-paging
      doc.addPage();
      cursorY = pageWrapInitialYPosition;
    }
    doc.text(xPosition, cursorY, lineText);
    cursorY += lineSpacing;
  })
  return cursorY-1*lineSpacing;
}
