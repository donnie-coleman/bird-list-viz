jQuery(document).ready(function($){
	var i = 1;
	var calls = $('ol')
	.map(function(i, element){
		var key = $(this).data('key');
		var url_start = "https://spreadsheets.google.com/feeds/cells/";
		var url_end = "/1/public/values?";
		var dfo = $.Deferred();

	 	$.ajax({
			url: url_start+key+url_end,
			data: {alt: "json-in-script"},
			dataType: "jsonp",
			cache: true
		})
		.done(function(root){
			$.when(listBirds3(root, key, false))
			.done(function(){
				dfo.resolve(i);
			});
		});

		return dfo.promise();
	});
	
	
	
	var matches = [];
	
	//find matches
	$.when.apply($,calls)
	.done(function(blah1, blah2){
		//console.log(blah1+" and "+blah2 +" are resolved");
		//console.log("FINDING MATCHES+++++++++++++++++++");
    	$('.bird-table:first-child .bird-name').each(function(){
	  		var left = $(this);
			var right = $('.bird-table:last-child .bird-name').filter(function(){ return $.text([this]) == left.text()});
			if(right.length){
				matches.push([left,right])
			}
		});
		//console.log(matches);
	})
	.done(function(x,y){
		$(".legend").show();
		//console.log("DRAWING MATCHES~~~~~~~~~~~~~~~~~~"+x+" "+y);
		drawMatches();
	});
	
	var drawMatches = function(){
		$('.new-link-line').remove();	
		for(match in matches){
			draw(matches[match][0],matches[match][1], match);
		}	
	}
		
	var draw = function(left, right, index){
	  left = $(left).closest("li")
	  right = $(right).closest("li")

  	  var linkLine = $('<div class="new-link-line"></div>').appendTo('body');
	  var originX = left.offset().left + left.outerWidth();
      var originY = left.offset().top + left.outerHeight() / 2;
      var endX = right.offset().left;
      var endY = right.offset().top + right.outerHeight() / 2;
      var length = Math.sqrt((endX - originX) * (endX - originX) 
          + (endY - originY) * (endY - originY));

      var angle = 180 / 3.1415 * Math.acos(( endY - originY) / length);
      if(endX > originX){
          angle *= -1;
	  }
	
  	  linkLine
      .css('top', originY)
      .css('left', originX)
      .css('height', length)
      .css('-webkit-transform', 'rotate(' + angle + 'deg)')
      .css('-moz-transform', 'rotate(' + angle + 'deg)')
      .css('-o-transform', 'rotate(' + angle + 'deg)')
      .css('-ms-transform', 'rotate(' + angle + 'deg)')
      .css('transform', 'rotate(' + angle + 'deg)');
		if(left.data("doy") > right.data("doy")){
			linkLine.css('background-color','#f00')
		}
		else if(left.data("doy") == right.data("doy")){
			linkLine.css('background-color','#FDD017')
		}
		linkLine.fadeIn("slow")
		
		left.attr('data-index',index);
		right.attr('data-index',index);
		linkLine.attr('data-index',index);
	}
	
	$(window).resize(drawMatches);
});

Date.prototype.getDOY = function() {
  var onejan = new Date(this.getFullYear(),0,1);
  return Math.ceil((this - onejan) / 86400000);
}

var listBirds3 = function(root, key, iterative) {	
   var feed = root.feed;
   var entries = feed.entry || [];
   var html = (iterative?["<li class='total'></li>"]:null);
   var previousDate;
   var previousMonth = 1;
   var currentYear = jQuery("[data-key="+key+"]").attr('data-year');
   var DATE_COL = 1;
   var BIRD_COL = 2;
   var TITLE_ROW = 1;
   var length = entries.length
   var totalBirds = 0;
   var drawMonth = false;
	
   var curr_date;
   var curr_month;
   var dayOfYear;	
	
   for (var i = 0; i < length; i++) {
    var entry = entries[i];
    var column = entry.gs$cell.col;
	var row = entry.gs$cell.row;
	 
    if(column == BIRD_COL && row != TITLE_ROW) {
  	
  		var content = entry.content.$t;
	  	var date = entries[i-1].content.$t;
	
	  	if(date && previousDate != date){
	  		var d = new Date(date);
	  		if(!isNaN(d)){		
	  			previousDate = date;
		  		curr_date = d.getDate();
		  		curr_month = d.getMonth();
		  		dayOfYear = d.getDOY();
		  		if(previousMonth != curr_month){
		  			previousMonth = curr_month;
					drawMonth = true;
		  		}
			} 
	  	}
	
		totalBirds += 1;	
		updateBirdList({key: key,
						doy: dayOfYear,
						bird: content,
						month: curr_month,
						date: curr_date,
						year: currentYear,
						total: totalBirds},
						drawMonth,
						html
						);
	 	drawMonth = false;
		}
	}	
}

var updateBirdList = function (details, drawMonth, html){
	var useHtml = (html != undefined && html != null)
    var m_names = [ "January", "February", "March", 
				   "April", "May", "June", "July", "August", "September", 
				   "October", "November", "December"];   
    var m_colors = [ "Aqua", "HotPink", "LimeGreen", 
				   "Magenta", "Plum", "Orange", "Crimson", "BurlyWood", "Gainsboro", 
				   "Tomato", "SandyBrown", "SkyBlue"];	
	var str = '';
	
	if(drawMonth){
		str += '<li class="month">'+ m_names[details.month] +' '+ details.year +'</li>';
	}
	str += '<li class="bird" data-doy="'+ details.doy +'" style="background-color:'+ m_colors[details.month] +'"><span class="bird-name">'+ details.bird +'</span> <span class="info"></span></li>';
	
	updateBirdTotal(details.key, details.total);
	
	var content = [];
	content.push('Seen: ')
	content.push(m_names[details.month] +' '+ details.date +', '+ details.year);
	content.push('(Day '+(details.doy || '0')+')');
	
	jQuery(str)
	.appendTo("[data-key="+ details.key +"]")
	.find(".info")
	.qtip({
		content: {
			text: content.join(' ')
		},
		style: { 
	      classes: 'qtip-shadow qtip-rounded qtip-dark'
	    }
	})
	.end()
	.find(".info")
	.each(function(){
		var $that = $(this);
		var tag = details.bird.replace(/\'|\s|\(.*\)/g,"");
		$.ajax({
			url: 'http://api.flickr.com/services/rest/',
			data: 'format=json&user_id=35323958%40N00&sort=random&method=flickr.photos.search&tags='+tag+'&api_key=3e9a8ddc137ebf38ae34a4cad4715941&nojsoncallback=1',
			dataType: 'json'
		})
		.done(function(data){
			//console.log(details.bird+" pics fetched.");
			$that.after(makeBirdImg(data,tag , true));			
		})
	});
}

var makeBirdImg = function(rsp, tag, isRandom) {
	if (!rsp || rsp.stat != "ok"){
	 return;
	}
	var s = "";
	if(rsp.photos && rsp.photos.total && rsp.photos.total > 0){
		 var total = rsp.photos.total;

		 for(var i = 0; i < total; i++){
		 	var photo = rsp.photos.photo[ i ];
		    var id = tag+i;
		    s += wrapImg(makeImg(photo,id), id);
		 }
	 }

	 return s;
}

var makeImg = function (photo, id){
	 var t_url = "http://farm" + photo.farm +
	 ".static.flickr.com/" + photo.server + "/" +
	 photo.id + "_" + photo.secret + "_" + "m.jpg";

	 var p_url = "http://www.flickr.com/photos/" +
	 photo.owner + "/" + photo.id;
	
	 if(!id){
		id="";
	 }

	 return  '<span id="'+id+'" style="display:none;"><img alt="'+ escape(photo.title) + '"src="' + t_url + '"/></span>';	
}

var wrapImg = function(img, id){
	return '<a class="thickbox birdimg" href="#TB_inline?height=300&width=300&inlineId='+id+'"></a>'+img;
}

var updateBirdTotal = function (key, total){
	jQuery("[data-key="+ key +"] .total").text(total + " Birds");
}