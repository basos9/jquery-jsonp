module( "main", { teardown: moduleTeardown } );

var hasDeferred = !!$.Deferred;

function testJSONP( name, outcome, options ) {
	test( name, function() {
		stop();
		expect( ( options.expect || 0 ) + 1 + hasDeferred );
		var xOptions = $.jsonp( $.extend( {}, options, {
			success: function() {
				ok( outcome === "success", "Success" );
			},
			error: function() {
				ok( outcome === "error", "Error" );
			},
			complete: function() {
				if ( options.complete ) {
					options.complete.call( this );
				}
				start();
			}
		}) );
		if ( hasDeferred ) {
			xOptions.done(function() {
				ok( outcome === "success", "Done" );
			}).fail(function() {
				ok( outcome === "error", "Fail" );
			});
		}
	});
}

testJSONP( "success", "success", {
	url: "http://gdata.youtube.com/feeds/api/users/julianaubourg?callback=?",
	data: {
		alt: "json-in-script"
	}
});

testJSONP( "error (HTTP Code)", "error", {
	url: "http://gdata.youtube.com/feeds/api/users/hgfusyggbvbdbrfvurgbirhtiytjrhjsrhk66?callback=?",
	data: {
		alt: "json-in-script"
	}
});

if ( !window.opera || window.opera.version() < 11.60 ) {
	testJSONP( "error (Syntax Error)", "error", {
		expect: window.opera ? 0 : 1,
		url: "data/syntax-error.js",
		cache: true,
		beforeSend: function() {
			this.oldOnError = window.onerror;
			window.onerror = function() {
				ok( true, "Syntax Error Thrown" );
			};
		},
		complete: function() {
			window.onerror = this.oldOnError;
		}
	});
}

if ( !window.opera ) {
	test( "error (Exception)", function() {
		stop();
		expect( 2 );
		$.jsonp({
			url: "http://gdata.youtube.com/feeds/api/users/julianaubourg?callback=?",
			beforeSend: function() {
				var oldOnError = window.onerror;
				window.onerror = function( flag ) {
					ok( flag !== undefined, "Exception Thrown" );
					window.onerror = oldOnError;
					start();
				};
			},
			success: function() {
				ok( true, "success" );
				throw "an exception";
			},
			complete: function() {
				window.onerror();
			}
		});
	});
}

testJSONP( "error (callback not called)", "error", {
	expect: 1,
	url: "data/no-callback.js",
	cache: true,
	complete: function() {
		strictEqual( window.bob, 33, "script was executed" );
		window.bob = false;
	}
});

test( "stress test", function() {

	var num = 20,
		count = num;

	expect( num );
	stop();

	for ( ; num ; num-- ) {
		$.jsonp({
			url: "http://gdata.youtube.com/feeds/api/users/julianaubourg?callback=?",
			success: function() {
				ok( true, "success" );
			},
			error: function() {
				ok( false, "error" );
			},
			complete: function() {
				if ( !( --count ) ) {
					start();
				}
			}
		});
	}
});


test( "callback error", function() {
		expect(2);

		$.jsonp({
			url: "http://gdata.youtube.com/feeds/api/users/julianaubourg?callback=?",
			cache: true,
			success: function() {
				try {
					return eval("var j = 7 + // syntax error");
				}
				catch(e) {
					ok( true, "Syntax error thrown");
				}
			},
			complete: function() {
				start();
			}
		});
		stop();
		ok(true, "done"); // to resume tests
});


function findHead(url1, url2) {
  function rquote(str) {
    return str.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
  };
  var t, obj,
    reg1 = new RegExp(rquote(url1), "g"),
    reg2 = url2 ? new RegExp(rquote(url2), "g") : null,
    head = $( "head" )[ 0 ] || document.documentElement,
    res = [],
    children = head.children;
  for (t=0;t<children.length; t++) {
    obj = children[t];
   
    if (!obj)
      continue;
    if ( /_jqjsp[0-9]+/.test(obj.id) &&  (reg1.test(obj.src)  || (reg2 && reg2.test(obj.src)))) {
      //console.log("FOUND "+t+" "+obj.src + " " + obj.id);
      res.push(obj);
    }
  }
  return res;
}

test( "cache", function() {

	var url = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=x&callback=?";
		urlpat = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=x&";
		
	$.jsonp({
		url: url,
    cache:false, // do append random
		complete: function() {
			start();
		}
	});
	var scr = findHead(urlpat);
	ok( scr.length === 1);
	ok( /_[0-9]+=$/.test(scr[0].src), "cache (browser) on");
	stop();


	url = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=z&callback=?";
  urlpat = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=z&";
	$.jsonp({
		url: url,
    cache:true, // do not append random
		complete: function() {
			start();
		}
	});

	var scr = findHead(urlpat);
	ok( scr.length === 1);
	ok( ! /_[0-9]+=$/.test(scr[0].src), "cache (browser) off");

	stop();
});



test( "abort", function() {

 var url = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=x&callback=?";
   urlpat = "http://gdata.youtube.com/feeds/api/users/julianaubourg?_nx=x&",
   xOpts = $.jsonp({
     url: url,
     cache:false, // do append random
     complete: function() {
       start();
     },
     error: function(x ,t) {
       ok(t === "aborted", "Request aborted");
     },
     success: function() {
       ok(false, "Request aborted"); // should fail
     },
   });
 var scr = findHead(urlpat);
 ok( scr.length === 1, "script tag created");
 stop();
 
 xOpts.abort();
 var scr = findHead(urlpat);
 ok( scr.length === 0, "script tag deleted");
 
 // CHECK for fetch 404
 url = "http://willx.notBeExisting.ccc";
 urlpat = "http://willx.notBeExisting.ccc";

 $.jsonp({
   url: url,
   cache:true, // do not append random
   complete: function() {
     start();
   },
   success: function() {
     ok(false, "Request failed"); // should fail
   },
   error: function(x, t) {
     ok(true, "Request failed"); // should fail
     ok(t === "error", "error type");
   }
 });

 var scr = findHead(urlpat);
 //ok( scr.length === 1, "nox script tag created");
 stop();
 
 
});

