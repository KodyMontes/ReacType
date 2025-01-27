import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import { Component } from '../../interfaces/Interfaces';
import ReactDOMServer from 'react-dom/server';
import { useDispatch, useSelector } from 'react-redux';
import { changeFocus } from '../../redux/reducers/slice/appStateSlice';
import { RootState } from '../../redux/store';

// DemoRender is the full sandbox demo of our user's custom built React components. DemoRender references the design specifications stored in state to construct
// real react components that utilize hot module reloading to depict the user's prototype application.
const DemoRender = (): JSX.Element => {
  const state = useSelector((store: RootState) => store.appState);
  const stylesheet = useSelector(
    (store: RootState) => store.appState.stylesheet
  );
  const dispatch = useDispatch();

  // Create React ref to inject transpiled code in inframe
  const iframe = useRef<any>();
  const demoContainerStyle = {
    width: '100%',
    backgroundColor: '#FBFBFB',
    border: '2px Solid grey',
    overflow: 'auto'
  };

  const html = `
    <html>
      <head>
      </head>
      <body>
        <div id="app">
        </div>
        <script>
          window.addEventListener('message', (event) => {
            try {
              app.innerHTML = event.data;
              document.querySelectorAll('a').forEach(element => {
                element.addEventListener('click', (event) => {
                  event.preventDefault();
                  window.top.postMessage(event.currentTarget.href, '*');
                }, true)
              });
            } catch (err) {
              const app = document.querySelector('#app');
              app.innerHTML = '<div style="color: red;"><h4>Syntax Error</h4>' + err + '</div>';
            }
          }, false);
        </script>
      </body>
    </html>
  `;

  //Switch between components when clicking on a link in the live render
  window.onmessage = (event) => {
    if (event.data === undefined) return;
    const component: string = event.data.data?.split('/').at(-1);
    const componentId =
      component &&
      state.components?.find((el) => {
        return el.name.toLowerCase() === component.toLowerCase();
      }).id;
    componentId && dispatch(changeFocus({ componentId, childId: null }));
  };

  //  This function is the heart of DemoRender it will take the array of components stored in state and dynamically construct the desired React component for the live demo
  //   Material UI is utilized to incorporate the apporpriate tags with specific configuration designs as necessitated by HTML standards.
  const componentBuilder = (array: any, key: number = 0) => {
    const componentsToRender = [];
    for (const element of array) {
      if (element.name !== 'separator') {
        const elementType = element.name;
        const childId = element.childId;
        const elementStyle = element.style;
        const innerText = element.attributes.compText;
        const classRender = element.attributes.cssClasses;
        const activeLink = element.attributes.compLink;
        let renderedChildren;
        if (
          elementType !== 'input' &&
          elementType !== 'img' &&
          elementType !== 'Image' &&
          element.children.length > 0
        ) {
          renderedChildren = componentBuilder(element.children);
        }
        if (elementType === 'input')
          componentsToRender.push(
            <Box
              component={elementType}
              className={classRender}
              style={elementStyle}
              key={key}
              id={`rend${childId}`}
            ></Box>
          );
        else if (elementType === 'img')
          componentsToRender.push(
            <Box
              component={elementType}
              src={activeLink}
              className={classRender}
              style={elementStyle}
              key={key}
              id={`rend${childId}`}
            ></Box>
          );
        else if (elementType === 'Image')
          componentsToRender.push(
            <Box
              component="img"
              src={activeLink}
              className={classRender}
              style={elementStyle}
              key={key}
              id={`rend${childId}`}
            ></Box>
          );
        else if (elementType === 'a' || elementType === 'Link')
          componentsToRender.push(
            <Box
              component="a"
              href={activeLink}
              className={classRender}
              style={elementStyle}
              key={key}
              id={`rend${childId}`}
            >
              {innerText}
              {renderedChildren}
            </Box>
          );
        else if (elementType === 'Switch')
          componentsToRender.push(<Switch>{renderedChildren}</Switch>);
        else if (elementType === 'Route')
          componentsToRender.push(
            <Route exact path={activeLink}>
              {renderedChildren}
            </Route>
          );
        else
          componentsToRender.push(
            <Box
              component={elementType}
              className={classRender}
              style={elementStyle}
              key={key}
              id={`rend${childId}`}
            >
              {innerText}
              {renderedChildren}
            </Box>
          );
        key += 1;
      }
    }
    return componentsToRender;
  };

  //initializes our 'code' which will be whats actually in the iframe in the demo render
  //this will reset every time we make a change
  let code = '';

  const currComponent = state.components.find(
    (element) => element.id === state.canvasFocus.componentId
  );

  //writes each component to the code
  componentBuilder(currComponent.children).forEach((element) => {
    try {
      code += ReactDOMServer.renderToString(element);
    } catch {
      return;
    }
  });

  //writes our stylesheet from state to the code
  code += `<style>${stylesheet}</style>`;

  //adds the code into the iframe
  useEffect(() => {
    iframe.current.contentWindow.postMessage(code, '*');
  }, [code]);

  return (
    <>
      <div id={'renderFocus'} style={demoContainerStyle}>
        <iframe
          ref={iframe}
          sandbox="allow-scripts"
          srcDoc={html}
          width="100%"
          height="100%"
        />
      </div>
    </>
  );
};

export default DemoRender;
