/**
 * Created by choncou on 2016/12/16.
 */
// The base url for the flickr photos endpoint
var FLICKR_BASE = 'https://api.flickr.com/services/rest/?method=flickr.photos.search&format=json&api_key=bdf3ed733e8c3707baa345f03a715f37';

// List of places
var PLACES = [
    {
        name: "Painted Ladies",
        location: {
            lat: 37.7762593,
            lng: -122.432758
        }
    },
    {
        name: "Alamo Square Park",
        location: {
            lat: 37.7763366,
            lng: -122.4346917
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
        else if (this.getZoom() < 15) { // Minimum zoom
            this.setZoom(15);
        }
    });
}
var googleReadyCallback;

// Create the url for the flickr image
function generateFlickrImageUrl(photo) {
    return 'https://farm' + photo.farm + '.staticflickr.com/' + photo.server + '/' + photo.id + '_' + photo.secret + '_q.jpg'
}

function AppViewModel() {
    var self = this;

    // Use static list of places for now. Could populate more from the server
    self.places = PLACES;
    self.markers = [];

    // Input text from the filter input
    self.filterText = ko.observable('');

    // A place that was clicked either in the list or it's marker
    self.selectedPlace = ko.observable();

    // store images for the selected place
    self.selectedPlaceImages = ko.observableArray([]);

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
        places.forEach(function (place) {
            var marker = createMarker(place);
            self.markers.push(marker);
        });
        setMapBounds();

        return places;
    });

    // Set the selected place
    self.selectPlace = function (place) {
        self.selectedPlace(place);
        map.setCenter(place.marker.getPosition());
        place.marker.setAnimation(google.maps.Animation.BOUNCE);
        if ($('#sidebar').hasClass('sidebar-show')) {
            toggleSidebar();
        }
    };

    // Set that no place is currently selected
    self.clearSelection = function () {
        var place = self.selectedPlace();
        var infoWindow = new google.maps.InfoWindow({
            content: "<h3>" + place.name + "</h3>",
            disableAutoPan: true,
        });
        infoWindow.open(map, place.marker);
        place.marker.setAnimation(null);
        self.selectedPlace(null);
    };


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
        place.marker = marker;
        return marker
    }

    // Called by initMap when google is initialised
    googleReadyCallback = function () {
        // Add markers to array if they are included in the filtered result
        var visiblePlaces = self.filteredPlaces();
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

    // Will automatically compute and set what images should be displayed
    self.computeSelectedPlaceImages = ko.computed(function () {
        var selectedPlace = self.selectedPlace();
        if (selectedPlace) {
            getFlickrImages(selectedPlace);
        } else {
            self.selectedPlaceImages([]);
        }
    });

    // Function to call Flickr API and get first 6 images taken at this place
    function getFlickrImages(place) {
        $.ajax(FLICKR_BASE, {
            data: {
                lat: place.location.lat,
                lon: place.location.lng,
                radius: 0.5,
                per_page: 6,
                accuracy: 16
            },
            success: function (data, status) {
                // Parse flickr response (The response is sent as a string with enclosed with other text)
                // This removes the first 14 characters and the last character then converts to JSON
                var responseObject = JSON.parse(data.slice(14, data.length-1));

                // Check if flickr request was successful
                if (responseObject.stat === 'ok') {
                    responseObject.photos.photo.forEach(function (photo) {
                        self.selectedPlaceImages.push({ url: generateFlickrImageUrl(photo) });
                    });
                } else {
                    console.log("Flickr Fetch Failed");
                    showConnectionFailure();
                }
            },
            error: function (error) {
                console.log("Flickr Fetch Failed");
                showConnectionFailure();
            }
        })
    }

    // Fail gracefully when an error occurs unexpectedly
    function showConnectionFailure() {
        alert('We are having trouble connecting. Try again later.')
    }
};

// Toggle class that will animate the sidebar to show/hide
$('#menu-button').click(toggleSidebar);

function toggleSidebar() {
    $('#sidebar').toggleClass('sidebar-show');
    $('#map').toggleClass('map-sidebar-showing');
}

ko.applyBindings(new AppViewModel());