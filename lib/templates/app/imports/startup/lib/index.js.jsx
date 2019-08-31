/** @namespace Common */<% if (config.engines.theme === 'material') { %>
// Material UI Theme config using roboto typefont and default mui.
import { createMuiTheme, responsiveFontSizes } from '@material-ui/core/styles';
let theme = createMuiTheme({
  typography: {
    useNextVariants: true,
  },
});
theme = responsiveFontSizes(theme);
export { theme };<% } %>
