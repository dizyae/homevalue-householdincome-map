var socket = io.connect('/');
var map;

if (navigator.geolocation) 
{
    navigator.geolocation.getCurrentPosition(setUserLocation);
}

function setUserLocation(position)
{
    var pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
    };

    map.setCenter(pos);
    map.setZoom(11);
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 39.0, lng: -96.5},
        zoom: 4,
        styles: [{
            featureType: 'poi',
            stylers: [{ visibility: 'off' }]  // Turn off points of interest.
        }, {
            featureType: 'transit.station',
            stylers: [{ visibility: 'off' }]  // Turn off bus stations, train stations, etc.
        }],
        disableDoubleClickZoom: true
    });

    var marker;

    function placeMarker(location)
    {
        if(marker)
        {
            marker.setPosition(location);
        }
        else
        {
            marker = new google.maps.Marker({
                position: location,
                map: map
            });
        }

        $('#message').hide(100);
        $('#data').hide(100, function(){
            $('#loading').show(200);
        });
    }

    map.addListener('click', function(e) {
        placeMarker(e.latLng);
        
        socket.emit('requestFIPS', {'lat':e.latLng.lat(), 'lng':e.latLng.lng()});
    });
}



