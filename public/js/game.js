function Game(gid, players, map, turn, regions, pRegions, playerNum, freeTroops, gameStarted){
    var self = this;
		// id of the game
    this.gid = gid;
		// array of the players in the game
    this.players = players;
		// map name
    this.map = map;
		// index of the player whose turn it is
    this.turn = turn;
    this.regions = regions;
    this.pRegions = pRegions;
    this.regionCols = {};
		// number of the player who's playing
    this.playerNum = playerNum;
		// number of free troops
		this.freeTroops = freeTroops;
		
		this.canAttack = false;
		if (gameStarted == players.length) {
		  this.canAttack = true;
		}
    console.log(this.pRegions);
    if($.cookie('playedGame')== null){
        $('#firstGame').modal('show');
        $.cookie('playedGame',true);
    }
}
Game.prototype.colorRegions = function(){
    for(var il = 0; il < game.regions.length; il++){
        console.log("------");
        var region = game.regions[il];
        var self = game;
        var col = self.getRegionColor(region.player,region.troops);
        $(self.pRegions[il]).data("player",region.player);
        game.regionCols[game.pRegions[il]] =  col;
        $(self.pRegions[il]).attr({fill:col})
        .click(function(){
            console.log(self.players[region.player]);
            $('#regionInfoPlayer').text(self.players[$(this).data("player")]);
            $('#regionInfo').modal('show');
        })
        .mouseenter(function(){ 
            $(this).css("cursor","pointer");
            $(this).attr({fill:'#FFF'}); })
        .mouseleave(function(){ 
            console.log(this.id);
            $(this).attr({fill:self.regionCols["#"+this.id]}); 
        });
        console.log(col);
        console.log("------");
    }
    return;
}

Game.prototype.getRegionColor = function(player, numTroops){
    if(player == 0){
        var c = Color("#156165");
        return c.lighten((numTroops)/20).hexString();
    } else if (player == 1){
        var c = Color("#470B49");
        return c.lighten((numTroops)/20).hexString();
    } else if (player == 2){
        var c = Color("#7F0000");
        return c.lighten((numTroops)/20).hexString();
    } else if (player == 3){
        var c = Color("#000B7F");
        return c.lighten((numTroops)/20).hexString();
    } else {
        return '#000';
    }
    return;
}
Game.prototype.updateTroops = function(regionid, newTroops){
  var pl = game.regions[game.getIndex(regionid)].player;
  var color = game.getRegionColor(pl, newTroops);
  $("#"+regionid).attr({fill:color})
  .click(function(){
      console.log(self.players[region.player]);
      $('#regionInfoPlayer').text(self.players[$(this).data("player")]);
      $('#regionInfo').modal('show');
  })
  .mouseenter(function(){ 
      $(this).css("cursor","pointer");
      $(this).attr({fill:'#FFF'}); })
  .mouseleave(function(){ 
      console.log(this.id);
      $(this).attr({fill:color}); 
  });
}

Game.prototype.attachClickListener = function() {
	for (var i = 0; i < this.regions.length; i++){
		var region = this.regions[i];
		var self = this;
		console.log(i);
		$(self.pRegions[i]).click(function(e){
				$(".regionTroops").text("");
        if (self.playerNum == self.getPlayer(this.id) && self.playerNum == self.turn){
          $("#troopsBlank").text("");
          $("#troopsBlank").append('<select data-placeholder="Your Favorite Type of Bear" style="width:350px;" id="regionInfoTroops" class="chosen regionTroops" tabindex="7">');
          for(var il = 1; il <= self.freeTroops + region.troops; il++){
  					if (il == region.troops){
  					  console.log('region-troops----')
  					  console.log(region.troops)
  					  console.log(il)
  					  console.log('region-troops++++')
  						$('.regionTroops').append("<option value="+il+" selected>"+il+"</option>");
  					} else {
  						$('.regionTroops').append("<option value="+il+">"+il+"</option>");
  					}
  				} 
  				$("#troopsBlank").append('</select>');
  				$("#troopsBlank").append('<input type="hidden" name="region" id="regionhidden">');
  				$("#regionhidden").val(self.getIndex[this.id]);
  				$(".save-troops").text("Save Troops")
  				.show()
  				.removeClass('btn-danger')
  				.removeClass('attack')
  				.addClass('save-troops')
  				.click(function(e){
  				  console.log("regionhidden: "+$("#regionhidden").val());
  				  if (self.regions[$("#regionhidden").val()].troops < $('.regionTroops').val()){
  				    self.freeTroops -= ($('.regionTroops').val() - self.regions[$("#regionhidden").val()].troops);
  				    self.regions[$("#regionhidden").val()].troops = parseInt($('.regionTroops').val());
  				    console.log("set regionhidden---");
  				    console.log(self.regions[$("#regionhidden").val()].troops)
  				    console.log("set regionhidden+++");
  				    self.colorRegions();
  				    self.initHUD();
  				    console.log('attachclicklistener--')
  				    self.attachClickListener();
  				  } else {
  				    self.freeTroops += (self.regions[$("#regionhidden").val()].troops - $('.regionTroops').val());
  				    self.regions[$("#regionhidden").val()].troops = $('.regionTroops').val();
  				    self.initHUD();
  				    console.log('attachclicklistener--')
  				    self.attachClickListener();
  				  }
  				  $('#regionInfo').modal('hide');
  				});
        }
        else {
          if(self.playerNum == self.turn){
            $("#troopsBlank").text("");
            $("#troopsBlank").text(region.troops);
            $(".save-troops").text("Attack")
            .addClass('btn-danger attack') 
            .click(function(e){
              $.get('/game/attack', {  })
            });
            if (!self.canAttack) {
              $(".save-troops").hide();
            }
          } else {
            $("#troopsBlank").text("");
            $("#troopsBlank").text(region.troops);
            $(".save-troops").hide()
          }
        }
				console.log('--e');
				console.log(e.target.id);
				console.log('++e ');
				$("#regionhidden").val(game.getIndex(this.id));
        $('#regionInfo').modal('show');
    })
	}
}

Game.prototype.getIndex = function(regionid){
  var regionNum = regionid.match(/\d/g);
  regionNum = regionNum.join("");
  return regionNum;
}

Game.prototype.getPlayer = function(regionid){
  var index = this.getIndex(regionid);
  var playerNum = this.regions[index].player;
  return playerNum;
}

Game.prototype.initHUD = function(){
  $(".pushMoves").hide();
  $(".refresh").hide();
  $(".freetroops").text(this.freeTroops);
  $('.playernames').text("")
  for( var i = 0; i < this.players.length; i++){
    $(".playernames").text($(".playernames").text()+this.players[i]);
    if(i != this.players.length-1){
      $(".playernames").text($(".playernames").text()+", ");
    }
  }
  if (this.playerNum != this.turn){
    $(".turn").text('It\'s '+this.players[this.turn]+'\'s turn.');
    $(".refresh").show().click(function(){
      window.location.reload();
    })
  }
  else{
    $(".turn").text('It\'s your turn.');
    $(".pushMoves").show();
    $(".pushMoves").click(function(e){
      console.log(game.regions)
      var regionJSON = JSON.stringify(game.regions);
      console.log(regionJSON);
      console.log(JSON.parse(regionJSON))
      $.get('/game/move', { gameid: self.gid, regions: regionJSON }, console.log('x'));//window.location.reload() );
    });
  }
}