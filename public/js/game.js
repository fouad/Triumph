function Game(gid, players, map, turn, regions, pRegions){
    var self = this;
    this.gid = gid;
    this.players = players;
    this.map = map;
    this.turn = turn;
    this.regions = regions;
    this.pRegions = pRegions;
    // _.each(this.pRegions, function(re){ console.log("#"+re); return ("#"+re); }); /* the path of the regions */
    console.log(this.pRegions);
    // console.log($(this.pRegions[0]).attr({fill:'#ff0000'}));
    $(this.pRegions[0]).attr({fill:self.getRegionColor(self.regions[0].player,self.regions[0].troops)});
    // $(this.pRegions[0]).mouseout({fill:self.getRegionColor(self.regions[0].player,self.regions[0].troops)});
}
Game.prototype.colorRegions = function(){
    for(var il = 0; il < this.regions.length; il++){
        console.log("------");
        console.log($(this.pRegions[il]));
        console.log("------");
        // console.log($(this.pRegions[il]).attr({fill:this.getRegionColor(this.regions[il].player,this.regions[il].troops)}));
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
    } else {
        return '#000';
    }
    return;
}