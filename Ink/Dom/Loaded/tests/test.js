/*globals equal,test,start,stop,expect*/
Ink.requireModules(['Ink.Dom.Loaded_1'], function (Loaded) {
   test('several Loaded callbacks called in order', function () {
        expect(3);  // 3 assertions
        stop(3);  // 3 start()s
        var i = 0;
        Loaded.run(function () {
            equal(++i, 1, 'called first');
            start();
        });
        Loaded.run(function () {
            equal(++i, 2, 'called second');
            start();
        });
        Loaded.run(function () {
            equal(++i, 3, 'called third');
            start();
        });
    });
    test('Several contexts', function () {
        expect(2);
        stop(2);
        var iframe = document.createElement('iframe');
        iframe.src = 'iframe.html';
        document.getElementsByTagName('body')[0].appendChild(iframe);
        var iframeWindow = iframe.contentWindow;
        console.log(iframeWindow)
        Loaded.run(iframeWindow, function () {
            deepEqual(this, iframeWindow, 'being called with the iframe window');
            start();
        });
        Loaded.run(window, function () {
            deepEqual(this, window, 'being called with this window');
            start();
        });
    });
    test('Nested calls', function () {
        expect(3);
        stop(3); // start() gets called thrice
        var i = 0;
        Loaded.run(function () {
            equal(++i, 1, 'called first');
            start();
            Loaded.run(function () {
                equal(++i, 2, 'called second');
                start();
                Loaded.run(function () {
                    equal(++i, 3, 'called third');
                    start();
                });
            });
        });
    });
    test('When document is loaded, still wait for next tick', function () {
        expect(2);
        stop();
        var i = 0;
        Loaded.run(function () {
            equal(++i, 2, 'called second, after the function returns');
            start();
        });
        equal(++i, 1, 'called first');
    });
});
