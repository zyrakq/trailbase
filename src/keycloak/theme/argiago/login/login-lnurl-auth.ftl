<#import "template.ftl" as layout>
<#import "components/atoms/link.ftl" as link>
<#import "components/atoms/form.ftl" as form>
<#import "components/atoms/input.ftl" as input>

<@layout.registrationLayout displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>
    <#if section = "title">
        ${msg("loginTitle",(realm.displayName!''))}
    <#elseif section = "form">
        <#if realm.password>
            <div class="login">
                <div id="content">
                    <div class="wrap" style="text-align: center">
                        <p>Scan the <b>LNURL QR code</b> to login</p>

                        <div class="text-center">
                            <@link.kw id="qrcode" target="_blank" href="lightning:${lnurlAuth}">
                                <img src="${qr}">
                            </@link.kw>
                        </div>

                        <div class="flex items-center justify-between">
                            <#if realm.rememberMe && !usernameEditDisabled??>
                                <@checkbox.kw
                                    checked=login.rememberMe??
                                    label=msg("rememberMe")
                                    name="rememberMe"
                                />
                            </#if>
                        </div>

                        <@form.kw id="kc-form-login" class="${properties.kcFormClass!}" action=url.loginAction method="post">
                            <@input.kw id="k1" type="hidden" name="k1" value="${k1}" />
                        </@form.kw>

                        <#if true >
                            <div>
                                <div class="about">
                                    <p>This page uses the lnurl-auth protocol.</p>
                                    <p>See <@link.kw id="qrcode" target="_blank" href="https://github.com/lnurl/luds#lnurl-documents">list of apps</@link.kw> that support it.</p>
                                </div>
                            </div>
                        </#if>
                    </div>
                </div>
            </div>

            <script type="text/javascript">
                    var url = '${pollingUrl}'.replaceAll('amp;', '');

                    var refreshIntervalId = setInterval(function(){
                        fetch(url)
                        .then( (response) => {
                                if (response.ok) {
                                    clearInterval(refreshIntervalId);
                                    console.log("POSTing kc-form-login");
                                    document.getElementById("kc-form-login").submit();
                                }
                            }
                        )
                    }, 3000);
            </script>
        </#if>
    </#if>
</@layout.registrationLayout>
