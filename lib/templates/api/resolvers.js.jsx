export const resolvers = {
  Query: {
    <%= camelCase %>(root, args, context) {
      // How to enable authentication
      // if (!context.user._id && !Meteor.isDevelopment) return null;
      return 'hello <%= camelCase %>';
    }
  }
};
