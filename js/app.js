/**
 * Created by choncou on 2016/12/16.
 */

// List of places
var PLACES = [
    {
        name: "Painted Ladies",
        location: {
            lat: 37.7762593,
            lng: -122.432758
        }
    }, // https://google-developers.appspot.com/maps/documentation/utils/geocoder/#place_id%3DChIJuX92JKWAhYARxVmeb8DQIYQ
    {
        name: "Alamo Square Park",
        location: {
            lat: 37.7763366,
            lng: -122.4346917
        }
    },
    {
        name: "Ida B Wells High School",
        location: {
            lat: 37.775089,
            lng: -122.434028
        }
    },
    {
        name: "Patricia's Green",
        location: {
            lat: 37.776225,
            lng: -122.424423
        }
    },
    {
        name: "Patxi's Pizza Hayes Valley",
        location: {
            lat: 37.776525,
            lng: -122.42491
        }
    },
    {
        name: "The Grove Hayes Valley",
        location: {
            lat: 37.776978,
            lng: -122.421465
        }
    },
    {
        name: "SFJAZZ Center",
        location: {
            lat: 37.776261,
            lng: -122.421376
        }
    }

];

var map;
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.776427, lng: -122.428616},
        zoom: 16
    });

    googleReadyCallback();

    google.maps.event.addListener(map, 'bounds_changed', function(event) {
        // Maximum zoom
        if (this.getZoom() > 17) {
            this.setZoom(17);
        }
    });
}

var googleReadyCallback;
function AppViewModel() {
    var self = this;

    // Use static list of places for now. Could populate more from the server
    self.places = PLACES;
    self.markers = [];

    self.filterText = ko.observable('');

    self.selectedPlace = ko.observable();

    // List of places after applying the filter
    self.filteredPlaces = ko.computed(function () {
        var filter = self.filterText();
        var places = self.places;

        // Apply filter to list of places
        if (filter !== '') {
            places = $.grep(places, function (place) {
                return place.name.toLowerCase().includes(filter.toLowerCase());
            });
        }

        // Check if google is ready
        if (!map) {
            return places;
        }

        // Remove all markers
        self.markers.forEach(function (marker) {
            marker.setMap(null);
        });
        self.markers.length = 0;

        // Add markers to array if they are included in the filtered result
        console.log(places);
        places.forEach(function (place) {
            var marker = createMarker(place);
            self.markers.push(marker);
        });
        setMapBounds();

        return places;
    });

    function createMarker(place) {
        var marker = new google.maps.Marker({
            map: map,
            animation: google.maps.Animation.DROP,
            position: new google.maps.LatLng(place.location.lat, place.location.lng),
            title: place.name
        });
        marker.addListener('click', function () {
           self.selectPlace(place);
        });

        return marker
    }

    googleReadyCallback = function () {
        // Add markers to array if they are included in the filtered result
        var visiblePlaces = self.filteredPlaces();
        console.log(visiblePlaces);
        visiblePlaces.forEach(function (place) {
            self.markers.push(createMarker(place));
        });
        setMapBounds();
    };

    // Get the map to move the view to focus on the currently visible markers
    function setMapBounds() {
        var bounds = new google.maps.LatLngBounds();
        self.markers.forEach(function (marker) {
            bounds.extend(marker.getPosition());
        });
        map.fitBounds(bounds);
    };

    self.selectPlace = function (place) {
        self.selectedPlace(place);
    };

    self.clearSelection = function () {
        self.selectedPlace(null);
    }
};

// Toggle class that will animate the sidebar to show/hide
$('#menu-button').click(function () {
    $('#sidebar').toggleClass('sidebar-show');
    $('#map').toggleClass('map-sidebar-showing');

});

ko.applyBindings(new AppViewModel());

// TODO: Create popup modal to show info with third party api