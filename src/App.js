import React, { Component } from 'react';
import Particles from 'react-particles-js';

import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';

import './App.css';
import 'tachyons';

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 800
      }
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "repulse"
      },
      onclick: {
        enable: true,
        mode: "push"
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 800,
        line_linked: {
          opacity: 1
        }
      },
      bubble: {
        distance: 800,
        size: 80,
        duration: 2,
        opacity: 0.8,
        speed: 3
      },
      repulse: {
        distance: 400,
        duration: 0.4
      },
      push: {
        particles_nb: 4
      },
      remove: {
        particles_nb: 2
      }
    }
  }
}



const initialState = {
  input: '',
  imageUrl: '',
  boxes: [],
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: ''
  }
};
class App extends Component {
  /* define the state */
  constructor() {
    super();
    this.state = initialState
  };

  // fetch data from root API
  componentDidMount() {
    fetch('https://smartbrain-tae-api.herokuapp.com/')
      .then(response => response.json())
      .then(console.log)
  }

  /* function that calculates the location of the face */
  calculateFaceLocations = (data) => {
    const regionsDetected = data.outputs[0].data.regions;
    const image = document.getElementById('inputimage');
    const widthImage = Number(image.width);
    const heightImage = Number(image.height);
    return regionsDetected.map(region => {
      const clarifaiFace = region.region_info.bounding_box;
      return this.calculateFaceSingleLocation(clarifaiFace, widthImage, heightImage)
    })

  }

  calculateFaceSingleLocation = (clarifaiFace, widthImage, heightImage) => {
    // calculate the offset
    return {
      leftCol: clarifaiFace.left_col * widthImage,
      topRow: clarifaiFace.top_row * heightImage,
      rightCol: widthImage - (clarifaiFace.right_col * widthImage),
      bottomRow: heightImage - (clarifaiFace.bottom_row * heightImage)
    }
  }

  /* function that saves the calculated offset in the state */
  displayFaceBoxes = (boxes) => {
    this.setState({
      boxes
    });
  }

  /* define the input state handler */
  onInputChange = (event) => {
    this.setState({
      input: event.target.value
    })
  }

  /* define the submit handler */
  onButtonSubmit = () => {
    // save the url
    this.setState({
      imageUrl: this.state.input
    })
    // send image input url to receive the clarifai response
    fetch('https://smartbrain-tae-api.herokuapp.com/imageurl', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        input: this.state.input
      })
    })
    .then(response => response.json())
    .then(response => {
      if (response) {
        fetch('https://smartbrain-tae-api.herokuapp.com/image', {
          method: 'PUT',
          headers: {
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
          .then(response => response.json())
          .then(count => {
            // old way
            //this.setState(Object.assign(this.state.user, { entries: count }))
            this.setState({
              user: {
                ...this.state.user,
                entries: count
              }
            });
          })
          .catch(console.log);
      }
      this.displayFaceBoxes(this.calculateFaceLocations(response))
    })
    .catch(err => console.log(err));
  }

  // change route
  onRouteChange = ( route ) => {
    if (route === 'signout') {
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({
        isSignedIn: true
      });
    }
    this.setState({
      route
    });
  }

  // handler to update the user when logged in
  loadUser = data => {

    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    })
  }

  render() {
    const {
      boxes,
      imageUrl,
      isSignedIn,
      route
    } = this.state;
    return (
      <div className="App">
        <Particles
          className='particles'
          params={particlesOptions} />
          <Navigation onRouteChange={this.onRouteChange} isSignedIn={isSignedIn} />
          {
          route === 'home' ?
          (
            <div>
              <Logo />
              <Rank name={this.state.user.name} entries={this.state.user.entries} />
              <ImageLinkForm onInputChange={this.onInputChange} onButtonSubmit={this.onButtonSubmit} />
              {imageUrl && <FaceRecognition imageUrl={imageUrl} boxes={boxes} />}
            </div>
          ) : (
            route === 'signin'
            ? <Signin onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
            : <Register onRouteChange={this.onRouteChange} loadUser={this.loadUser} />
          )
        }
      </div>
    );
  }
}

export default App;
