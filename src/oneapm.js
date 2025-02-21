/**
 * OneAPM agent global.configuration.
 *
 * See lib/global.config.defaults.js in the agent distribution for a more complete
 * description of global.configuration variables and their potential values.
 */
exports.global.config = {
  /**
   * Array of application names.
   */
  app_name : [global.config.bbsname],
  /**
   * Your OneAPM license key.
   */
  license_key : global.config.oneapm_key,
  logging : {
    /**
     * Level at which to log. 'trace' is most useful to OneAPM when diagnosing
     * issues with the agent, 'info' and higher will impose the least overhead on
     * production applications.
     */
    level : 'info'
  },
  transaction_events: {
        enabled: true
  }
};
