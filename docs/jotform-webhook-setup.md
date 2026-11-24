# Connect Dominus Jotform submissions to the CRM

The production receiver is `https://www.dominustaxconsultants.com/api/jotform`. It requires the secret token already configured in Vercel. The complete, ready-to-paste URL is stored locally in the ignored file `jotform-webhook-url.local`. Do not commit or share that file.

Configure the **same URL** on both existing forms:

| Form | Jotform ID |
| --- | --- |
| Client intake | `262376514662461` |
| Consultant application | `262339213591053` |

For each form, open **Form Builder → Settings → Integrations → Webhooks**, paste the URL in **Add WebHook**, then choose **Complete Integration** and **Finish**. This is Jotform's [current webhook setup flow](https://www.jotform.com/help/245-how-to-send-submission-data-via-a-webhook/). Keep the existing public form links on the website.

The receiver accepts the form fields and Jotform's `rawRequest` JSON, validates the form ID and submission ID, and uses the submission ID for duplicate protection. Test one synthetic submission per form, then confirm it appears in the correct CRM pipeline. Jotform's standard webhook timeout is five seconds, so investigate delivery failures in Jotform and Vercel logs if a submission does not appear.
