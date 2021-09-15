define([
    'jquery',
    'mage/utils/wrapper',
    'Swissup_Recaptcha/js/model/recaptcha-assigner'
], function ($, wrapper, recaptchaAssigner) {
    'use strict';

    var deferred = $.Deferred();

    deferred.success = deferred.done.bind(deferred);

    return function (sezzleCheckoutWrapper) {
        /**
         * Before button click check if invisible recaptcha enabled.
         */
        sezzleCheckoutWrapper.beforeOnClick = wrapper.wrap(sezzleCheckoutWrapper.beforeOnClick, function () {
            var args = Array.prototype.slice.call(arguments),
                originalMethod = args.shift(args),
                recaptcha = recaptchaAssigner.getRecaptcha();

            if (recaptcha &&
                recaptcha.options.size === 'invisible' &&
                !recaptcha.getResponse()
            ) {
                // It is invisible recaptcha. We have to postpone original method.
                // And call it when recaptcha response received.
                recaptcha.element.one('recaptchaexecuted', function () {
                    originalMethod.apply(null, args)
                        .done(deferred.resolve)
                        .fail(deferred.reject);
                });
                recaptcha.execute();

                return deferred;

            }

            return originalMethod.apply(null, args);
        });

        /**
         * Append sezzle payment object with recaptcha data.
         */
        sezzleCheckoutWrapper.getSezzlePayment = wrapper.wrap(sezzleCheckoutWrapper.getSezzlePayment, function () {
            var args = Array.prototype.slice.call(arguments),
                originalMethod = args.shift(args),
                recaptcha = recaptchaAssigner.getRecaptcha(),
                sezzlePayment;

            sezzlePayment = originalMethod.apply(null, args);
            recaptchaAssigner(sezzlePayment);

            return sezzlePayment;
        });

        return sezzleCheckoutWrapper;
    };
});
