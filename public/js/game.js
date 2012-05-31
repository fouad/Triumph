function Game(gid, players, map, turn, regions, pRegions, playerNum){
    var self = this;
    this.gid = gid;
    this.players = players;
    this.map = map;
    this.turn = turn;
    this.regions = regions;
    this.pRegions = pRegions;
    this.regionCols = {};
    this.playerNum = playerNum;
    console.log(this.pRegions);
    if($.cookie('playedGame')== null){
        $('#firstGame').modal('show');
        $.cookie('playedGame',true);
    }
}
Game.prototype.colorRegions = function(){
    for(var il = 0; il < this.regions.length; il++){
        console.log("------");
        console.log($(this.pRegions[il]));
        var region = this.regions[il];
        var self = this;
        var col = self.getRegionColor(region.player,region.troops);
        $(self.pRegions[il]).data("player",region.player);
        this.regionCols[this.pRegions[il]] =  col;
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