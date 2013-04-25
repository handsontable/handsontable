Bullet = function(x, y, angle) {
	
	var speed = 10; 
	
	
	
	this.update = function() {
		
		this.pos.plusEq(this.vel); 
		this.life--; 
		if(this.life<0) this.enabled = false; 
		
	};
	
	this.draw = function(c) {
	
		if(!this.enabled) return; 
	
		c.lineWidth =2; 
		c.strokeStyle = "#fff"; 
		c.beginPath(); 
		c.arc(this.pos.x,this.pos.y,2, 0, Math.PI*2, true); 
		c.stroke();
	
	};
	
	this.reset = function(x, y, angle) {
		
		this.pos = new Vector2(x,y);
		var unitv = new Vector2(1,0); 

		// instead set Vector with speed and rotate
		unitv.rotate(angle); 

		this.vel = unitv.clone();
		this.vel.multiplyEq(speed); 

		unitv.multiplyEq(10); 
		this.pos.plusEq(unitv); 

		this.enabled = true; 

		this.life = 50; 
	
	}
	
	this.reset(x,y,angle); 
	
};