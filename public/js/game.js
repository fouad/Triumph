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
        if(numTroops < 10){
            return '#156165';
        } else if (numTroops < 25) {
            return '#1D858B';
        } else if (numTroops < 40) {
            return '#25AAB2';
        } else {
            return '#32E7F1';
        }
    } else if (player == 1){
        if(numTroops < 10){
            return '#470B49';
        } else if (numTroops < 25) {
            return '#600F63';
        } else if (numTroops < 40) {
            return '#6D1170';
        } else {
            return '#AA1BAF';
        }
    } else if (player == 2){
        if(numTroops < 10){
            return '#7F0000';
        } else if (numTroops < 25) {
            return '#BF0000';
        } else if (numTroops < 40) {
            return '#E50000';
        } else {
            return '#FF0000';
        }
    } else if (player == 3){
        if(numTroops < 10){
            return '#000B7F';
        } else if (numTroops < 25) {
            return '#0011BF';
        } else if (numTroops < 40) {
            return '#0014E5';
        } else {
            return '#0017FF';
        }
    } else {
        return '#000';
    }
    return;
}