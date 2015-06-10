var request = require('superagent');


// Query remote endpoint url and map response according passed options
module.exports = function(url, options) { return new Promise(function(RS, RJ) {
	request.get(url)
    .end((function(E, R) {
      if(E)
        RJ('End point request failed: ' + E);

      // Mapping routines
      RS({
				ckan: {
					'3.0': {
						base: function(input) { return {}; },
						tabular: function(input) { return {}; }
					}
				}
			});
    }).bind(this));
}); }