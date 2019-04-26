/*
 * jQuery Image Gallery Demo JS 3.0.1
 * https://github.com/blueimp/jQuery-Image-Gallery
 *
 * Copyright 2013, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */
/*jslint unparam: true, regexp: true */
/*global $ */
$(function() {
    'use strict';
    // Load demo images from flickr:
    $.ajax({
        // Flickr API is SSL only:
        // https://code.flickr.net/2014/04/30/flickr-api-going-ssl-only-on-june-27th-2014/
        url: 'https://api.flickr.com/services/rest/',
        data: {
            api_key: '2a05b6c699c389659c467768e7e03439', // この部分は必ず自分のapi_keyを記述
            format: 'json',
            method: "flickr.photos.search", //写真検索
            text: "music", //検索語
			license: "4,5,6", //ライセンス
            sort: "relevance", //並べ替え relevanceは関連度の高い順
        },
        dataType: 'jsonp',
        jsonp: 'jsoncallback'
    }).done(function(result) {
        var linksContainer = $('#links'),
            baseUrl;
        // Add the demo images as links with thumbnails to the page:
        $.each(result.photos.photo, function(index, photo) {
            baseUrl = 'https://farm' + photo.farm +
                '.staticflickr.com/' + photo.server +
                '/' + photo.id + '_' + photo.secret;
            $('<a/>').append($('<img>').prop('src',baseUrl + '_s.jpg'))
			.prop('href',baseUrl + '_b.jpg')
			.prop('title',photo.title)
			.attr('data-dialog', '')
            .appendTo(linksContainer);
        });
    });
    // Initialize the slideshow button:
    $('#slideshow-button').button({
        icons: {
            primary: 'ui-icon-image'
        }
    }).on('click', function() {
        $('#blueimp-gallery-dialog .blueimp-gallery').data(
            'startSlideshow', true);
        $('#links').children().first().click();
    });
});