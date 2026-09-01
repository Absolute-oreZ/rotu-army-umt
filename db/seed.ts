import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";
import {
  DEFAULT_ADMIN,
  DEFAULT_FACEBOOK_URL,
  DEFAULT_FAQ_ENTRIES,
  DEFAULT_HERO_IMAGE_PATH,
  DEFAULT_INSTAGRAM_URL,
  DEFAULT_SEE_MORE_LINKS,
  DEFAULT_TESTIMONIAL_ENTRIES,
  DEFAULT_INTAKES,
  DEFAULT_MEMBERS,
  DEFAULT_CADET_QUOTES,
  DEFAULT_CADET_DISPLAY_PHOTO_PATH,
  DEFAULT_CADETS_INFO,
  DEFAULT_CADET_PLATOON_NOS,
  DEFAULT_CADET_PHYSICAL,
  DEFAULT_OFFICERS_AND_INSTRUCTORS,
  DEFAULT_STUDY_PROGRAMS,
  DEFAULT_TESTIMONIAL_ARMY_NOS,
  DEFAULT_EVENTS,
  DEFAULT_EVENT_TAGS,
  DEFAULT_GOOGLE_MAP_LOCATION_URL,
  DEFAULT_OFFICIAL_EMAIL,
  DEFAULT_CONTACT_REASONS,
  DEFAULT_YOUTUBE_URL,
  DEFAULT_TIKTOK_URL,
  DEFAULT_X_URL,
  DEFAULT_BLUE_BG_PHOTO_PATH,
  DEFAULT_PLATOONS,
  DEFAULT_NEWSLETTER_SUBSCRIBERS,
  DEFAULT_NEWSLETTER_CAMPAIGNS,
  DEFAULT_TREASURY_ACCOUNTS,
  DEFAULT_COLLECTIONS,
  DEFAULT_EXPENSES,
  DEFAULT_CLAIMS,
} from "../lib/data";
import { calculateBMI, computeAcademicSchedule } from "@/lib/utils";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    return;
  }

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;

    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

async function seed() {
  await sql`
    TRUNCATE TABLE
      platoons,
      testimonial_translations,
      testimonials,
      officers_and_instructors,
      cadets,
      members,
      sessions,
      academic_years,
      intake_display_photos,
      intake_patch_explanation_translations,
      intake_patch_explanations,
      intake_translations,
      intakes,
      frequently_asked_question_translations,
      frequently_asked_questions,
      see_more_links,
      webapp_contents,
      admin_users,
      study_programs,
      event_display_photos,
      events_to_tags,
      event_tag_translations,
      event_tags,
      event_translations,
      events,
      expense_receipts,
      expenses,
      collection_payments,
      collections,
      treasury_accounts,
      claims,
      newsletter_campaign_deliveries,
      newsletter_campaign_attachments,
      newsletter_campaign_translations,
      newsletter_campaigns,
      academic_exam_results,
      exams,
      cadet_accounts,
      admin_invitations,
      contact_reasons,
      contact_reason_translations,
      newsletter_subscribers,
      admin_role_audit_logs
    RESTART IDENTITY CASCADE
  `;

  const studyProgramIds: number[] = [];

  for (const program of DEFAULT_STUDY_PROGRAMS) {
    const [row] = await sql<[{ id: number }]>`
      insert into study_programs (slug, name, is_active)
      values (${program.slug}, ${program.name}, true)
      returning id
    `;

    studyProgramIds.push(row.id);
  }

  // Insert dummy platoons
  for (const p of DEFAULT_PLATOONS) {
    await sql`
      INSERT INTO platoons (platoon_no, display_name, slug, status, color, tag_line, flag_photo_path)
      VALUES (${p.platoonNo}, ${p.displayName}, ${p.slug}, ${p.status}, ${p.color}, ${p.tagLine}, ${p.flagPhotoPath})
    `;
  }

  const [adminMemberRow] = await sql<[{ id: number }]>`
    INSERT INTO members (
      army_no,
      rank,
      name,
      personal_email,
      edu_email,
      display_name,
      gender,
      role,
      religion,
      race,
      address,
      birthdate,
      age,
      kor,
      red_bg_photo_path,
      blue_bg_photo_path
    )
    VALUES (
      2099,
      'MAJOR',
      ${DEFAULT_ADMIN.fullName},
      ${DEFAULT_ADMIN.personalEmail},
      ${DEFAULT_ADMIN.personalEmail},
      'Yong',
      'MALE',
      'OFFICER',
      'CHRISTIAN',
      'CHINESE',
      'Kuala Lumpur',
      '2000-01-01',
      26,
      'Rejimen Askar Wataniah (RAW)',
      ${DEFAULT_CADET_DISPLAY_PHOTO_PATH},
      ${DEFAULT_BLUE_BG_PHOTO_PATH}
    )
    RETURNING id
  `;

  await sql`
    insert into admin_users (
      auth_user_id,
      member_id,
      email,
      role
    )
    values (
      ${DEFAULT_ADMIN.authUserId},
      ${adminMemberRow.id},
      ${DEFAULT_ADMIN.personalEmail},
      ${DEFAULT_ADMIN.role}
    )
  `;

  const [webappContent] = await sql<[{ id: number }]>`
    insert into webapp_contents (
      singleton_key,
      hero_image_path,
      facebook_url,
      instagram_url,
      youtube_url,
      tiktok_url,
      x_url,
      google_map_location_url,
      official_email
    )
    values (
      true,
      ${DEFAULT_HERO_IMAGE_PATH},
      ${DEFAULT_FACEBOOK_URL},
      ${DEFAULT_INSTAGRAM_URL},
      ${DEFAULT_YOUTUBE_URL},
      ${DEFAULT_TIKTOK_URL},
      ${DEFAULT_X_URL},
      ${DEFAULT_GOOGLE_MAP_LOCATION_URL},
      ${DEFAULT_OFFICIAL_EMAIL}
    )
    returning id
  `;

  for (const reason of DEFAULT_CONTACT_REASONS) {
    const [reasonRow] = await sql<[{ id: number }]>`
      insert into contact_reasons (
        icon_key,
        sort_order
      )
      values (
        ${reason.iconKey},
        ${reason.sortOrder}
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = reason.translations[locale];
      await sql`
        insert into contact_reason_translations (
          reason_id,
          locale,
          title,
          description
        )
        values (
          ${reasonRow.id},
          ${locale},
          ${translation.title},
          ${translation.description}
        )
      `;
    }
  }

  for (let i = 0; i < DEFAULT_FAQ_ENTRIES.length; i += 1) {
    const faq = DEFAULT_FAQ_ENTRIES[i];

    const [faqRow] = await sql<[{ id: number }]>`
      insert into frequently_asked_questions (
        webapp_content_id,
        sort_order,
        status
      )
      values (
        ${webappContent.id},
        ${i + 1},
        'PUBLISHED'
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = faq[locale];

      await sql`
        insert into frequently_asked_question_translations (
          faq_id,
          locale,
          question,
          answer
        )
        values (
          ${faqRow.id},
          ${locale},
          ${translation.question},
          ${translation.answer}
        )
      `;
    }
  }

  for (let i = 0; i < DEFAULT_SEE_MORE_LINKS.length; i += 1) {
    const entry = DEFAULT_SEE_MORE_LINKS[i];

    await sql`
      insert into see_more_links (
        webapp_content_id,
        title,
        link,
        image_path,
        sort_order,
        status
      )
      values (
        ${webappContent.id},
        ${entry.title},
        ${entry.link},
        ${entry.imagePath},
        ${i + 1},
        'PUBLISHED'
      )
    `;
  }

  const intakeIds: number[] = [];

  for (const intake of DEFAULT_INTAKES) {
    const [intakeRow] = await sql<[{ id: number }]>`
      insert into intakes (
        intake_no,
        display_name,
        slug,
        status,
        start_year,
        color,
        tag_line,
        cover_photo_path,
        patch_photo_path,
        inner_photo_path,
        tshirt_photo_path
      )
      values (
        ${intake.intakeNo},
        ${intake.displayName},
        ${intake.slug},
        'PUBLISHED',
        ${intake.startYear},
        ${intake.color},
        ${intake.tagLine},
        ${intake.coverPhotoPath},
        ${intake.patchPhotoPath},
        ${intake.innerPhotoPath},
        ${intake.tshirtPhotoPath}
      )
      returning id
    `;

    intakeIds.push(intakeRow.id);

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      const translation = intake.translations[locale];

      await sql`
          insert into intake_translations (
            intake_id,
            locale,
            summary
          )
          values (
            ${intakeRow.id},
            ${locale},
            ${translation.summary}
          )
        `;
    }

    for (const key of ["ANIMAL", "COLOR", "PHILOSOPHY"] as const) {
      const [patchRow] = await sql<[{ id: number }]>`
        insert into intake_patch_explanations (
          intake_id,
          key
        )
        values (
          ${intakeRow.id},
          ${key}
        )
        returning id
      `;

      const translations = intake.patchExplanations[key];

      for (const locale of ["en", "ms", "zh", "ta"] as const) {
        await sql`
          insert into intake_patch_explanation_translations (
            patch_explanation_id,
            locale,
            value
          )
          values (
            ${patchRow.id},
            ${locale},
            ${translations[locale]}
          )
        `;
      }
    }

    for (const photoPath of intake.displayPhotos) {
      await sql`
        insert into intake_display_photos (
          intake_id,
          photo_path
        )
        values (
          ${intakeRow.id},
          ${photoPath}
        )
      `;
    }

    const schedule = computeAcademicSchedule(intake.startYear);

    for (const { yearNumber, calendarYear, sessions } of schedule) {
      const [yearRow] = await sql<[{ id: number }]>`
        insert into academic_years (
          intake_id,
          year_number,
          calendar_year
        )
        values (
          ${intakeRow.id},
          ${yearNumber},
          ${calendarYear}
        )
        returning id
      `;

      for (const { sessionNumber } of sessions) {
        await sql`
          insert into sessions (
            academic_year_id,
            session_number
          )
          values (
            ${yearRow.id},
            ${sessionNumber}
          )
        `;
      }
    }
  }

  for (const m of DEFAULT_MEMBERS) {
    await sql`
      insert into members (
        army_no,
        rank,
        name,
        personal_email,
        edu_email,
        display_name,
        gender,
        role,
        religion,
        race,
        address,
        birthdate,
        age,
        kor,
        red_bg_photo_path,
        blue_bg_photo_path
      )
      values (
        ${m.armyNo},
        ${m.rank},
        ${m.name},
        ${m.personalEmail},
        ${m.personalEmail},
        ${m.displayName},
        ${m.gender},
        ${m.role},
        ${m.religion},
        ${m.race},
        ${m.address},
        ${m.birthdate},
        ${m.age},
        ${m.kor},
        ${m.redBgPhotoPath},
        ${m.blueBgPhotoPath}
      )
    `;
  }

  for (let i = 0; i < DEFAULT_CADETS_INFO.length; i += 1) {
    const c = DEFAULT_CADETS_INFO[i];
    const physical = DEFAULT_CADET_PHYSICAL[i % DEFAULT_CADET_PHYSICAL.length];

    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${c.armyNo}
    `;

    if (!memberRow) continue;

    const intakeId = intakeIds[i % intakeIds.length];
    const studyProgramId = studyProgramIds[i % studyProgramIds.length];
    const bmi = calculateBMI(physical.height, physical.weight) ?? 0;

    await sql`
      insert into cadets (
        matric_no,
        is_active,
        quote,
        display_photo_path,
        cgpa,
        height,
        weight,
        bmi,
        study_program_id,
        intake_id,
        platoon_id,
        member_id
      )
      values (
        ${"MAT-" + c.armyNo},
        true,
        ${DEFAULT_CADET_QUOTES[i % DEFAULT_CADET_QUOTES.length]},
        ${DEFAULT_CADET_DISPLAY_PHOTO_PATH},
        ${physical.cgpa},
        ${physical.height},
        ${physical.weight},
        ${bmi},
        ${studyProgramId},
        ${intakeId},
        ${DEFAULT_CADET_PLATOON_NOS[i]},
        ${memberRow.id}
      )
    `;
  }

  for (const oi of DEFAULT_OFFICERS_AND_INSTRUCTORS) {
    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${oi.armyNo}
    `;

    if (!memberRow) continue;

    await sql`
      insert into officers_and_instructors (
        member_id,
        is_active,
        year_of_experience
      )
      values (
        ${memberRow.id},
        ${oi.isActive},
        ${oi.yearOfExperience}
      )
    `;
  }

  for (let i = 0; i < DEFAULT_TESTIMONIAL_ENTRIES.length; i += 1) {
    const testimonial = DEFAULT_TESTIMONIAL_ENTRIES[i];
    const armyNo = DEFAULT_TESTIMONIAL_ARMY_NOS[i];

    const [memberRow] = await sql<[{ id: number }]>`
      select id from members
      where army_no = ${armyNo}
    `;

    if (!memberRow) continue;

    const [testimonialRow] = await sql<[{ id: number }]>`
      insert into testimonials (
        member_id,
        status,
        sort_order
      )
      values (
        ${memberRow.id},
        'PUBLISHED',
        ${i + 1}
      )
      returning id
    `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      await sql`
        insert into testimonial_translations (
          testimonial_id,
          locale,
          content
        )
        values (
          ${testimonialRow.id},
          ${locale},
          ${testimonial.translations[locale]}
        )
      `;
    }
  }

  const tagIdMap = new Map<string, number>();

  for (const tag of DEFAULT_EVENT_TAGS) {
    const [tagRow] = await sql<[{ id: number }]>`
    insert into event_tags (
      slug
    )
    values (
      ${tag.slug}
    )
    returning id
  `;

    tagIdMap.set(tag.slug, tagRow.id);

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
      await sql`
      insert into event_tag_translations (
        tag_id,
        locale,
        name
      )
      values (
        ${tagRow.id},
        ${locale},
        ${tag.translations[locale]}
      )
    `;
    }
  }

  for (const event of DEFAULT_EVENTS) {
    const [eventRow] = await sql<[{ id: number }]>`
    insert into events (
      name,
      slug,
      start_date,
      end_date,
      location,
      participant_count,
      cover_photo_path,
      cover_photo_width,
      cover_photo_height,
      video_path,
      status
    )
    values (
      ${event.name},
      ${event.slug},
      ${event.startDate.toISOString()},
      ${event.endDate.toISOString()},
      ${event.location},
      ${event.participantCount},
      ${event.coverPhotoPath},
      ${event.coverPhotoWidth},
      ${event.coverPhotoHeight},
      ${event.videoPath},
      'PUBLISHED'
    )
    returning id
  `;

    for (const locale of ["en", "ms", "zh", "ta"] as const) {
          const translation = event.translations[locale];

          await sql`
          insert into event_translations (
            event_id,
            locale,
            title,
            summary
          )
          values (
            ${eventRow.id},
            ${locale},
            ${translation.title},
            ${translation.summary}
          )
        `;
        }

    for (const photo of event.displayPhotos) {
      await sql`
      insert into event_display_photos (
        event_id,
        photo_path
      )
      values (
        ${eventRow.id},
        ${photo}
      )
    `;
    }

    for (const tag of event.tags) {
      const tagId = tagIdMap.get(tag);

      if (!tagId) continue;

      await sql`
      insert into events_to_tags (
        event_id,
        tag_id
      )
      values (
        ${eventRow.id},
        ${tagId}
      )
    `;
    }
  }

  const [adminUserRow] = await sql<[{ id: string }]>`
    select id from admin_users where auth_user_id = ${DEFAULT_ADMIN.authUserId}
  `;

  await sql`
    insert into admin_invitations (
      member_id, email, role, intake_id, invited_by_auth_user_id
    )
    values (
      ${adminMemberRow.id}, 'secretary.seed@example.com', 'SECRETARY',
      ${intakeIds[0]}, ${DEFAULT_ADMIN.authUserId}
    )
  `;

  await sql`
    insert into admin_role_audit_logs (
      action, changed_by_admin_user_id, target_admin_user_id,
      target_member_name, old_role, new_role
    )
    values (
      'INVITED', ${adminUserRow.id}, null, 'Seed Secretary', null, 'SECRETARY'
    )
  `;

  const subscriberIds: string[] = [];
  for (const subscriber of DEFAULT_NEWSLETTER_SUBSCRIBERS) {
    const [row] = await sql<[{ id: string }]>`
      insert into newsletter_subscribers (
        email, preferred_locale, status, confirmation_token_hash,
        unsubscribe_token_hash, confirmed_at, unsubscribed_at
      )
      values (
        ${subscriber.email}, ${subscriber.preferredLocale}, ${subscriber.status},
        ${subscriber.confirmationTokenHash}, ${subscriber.unsubscribeTokenHash},
        ${subscriber.confirmedAt}, ${subscriber.unsubscribedAt}
      )
      returning id
    `;

    subscriberIds.push(row.id);
  }

  const campaignIds: number[] = [];
  for (const campaign of DEFAULT_NEWSLETTER_CAMPAIGNS) {
    const [row] = await sql<[{ id: number }]>`
      insert into newsletter_campaigns (
        subject, preview_text, content_html, content_text, status,
        scheduled_at, sent_at, recipient_count, sent_by_admin_user_id
      )
      values (
        ${campaign.subject}, ${campaign.previewText}, ${campaign.contentHtml},
        ${campaign.contentText}, ${campaign.status}, ${campaign.scheduledAt},
        ${campaign.sentAt}, ${campaign.recipientCount},
        ${campaign.status === "DRAFT" ? null : adminUserRow.id}
      )
      returning id
    `;
    campaignIds.push(row.id);

    if (campaign.translations) {
      for (const locale of ["en", "ms", "zh", "ta"] as const) {
        const translation = campaign.translations[locale];
        await sql`
          insert into newsletter_campaign_translations (
            campaign_id, locale, subject, preview_text, content_html, content_text
          )
          values (
            ${row.id}, ${locale}, ${translation.subject}, ${translation.previewText},
            ${translation.contentHtml}, ${translation.contentText}
          )
        `;
      }
    }
  }

  await sql`
    insert into newsletter_campaign_attachments
      (campaign_id, file_name, storage_path, content_type, file_size)
    values
      (${campaignIds[0]}, 'update.pdf', 'newsletter/seed/update.pdf', 'application/pdf', 2048)
  `;

  await sql`
    insert into newsletter_campaign_deliveries
      (campaign_id, subscriber_id, email, locale, status, provider_message_id, sent_at)
    values
      (${campaignIds[0]}, ${subscriberIds[0]}, ${DEFAULT_NEWSLETTER_SUBSCRIBERS[0].email}, 'en',
       'SENT', 'seed-message-id', '2026-02-15T08:00:00.000Z')
  `;

  const treasuryAccountIds: number[] = [];
  for (const account of DEFAULT_TREASURY_ACCOUNTS) {
    const [row] = await sql<[{ id: number }]>`
      insert into treasury_accounts (
        intake_id, treasurer_id, bank_name, account_number, qr_code_path, duitnow_id
      )
      values (
        ${intakeIds[0]}, ${adminUserRow.id}, ${account.bankName}, ${account.accountNumber},
        ${account.qrCodePath}, ${account.duitNowId}
      )
      returning id
    `;
    treasuryAccountIds.push(row.id);
  }

  const collectionIds: number[] = [];
  for (let i = 0; i < DEFAULT_COLLECTIONS.length; i += 1) {
    const collection = DEFAULT_COLLECTIONS[i];
    const [row] = await sql<[{ id: number }]>`
      insert into collections (
        intake_id, treasurer_id, title, slug, purpose, description, amount,
        is_fixed_amount, is_receipt_required, payment_account_id, status
      )
      values (
        ${intakeIds[0]}, ${adminUserRow.id}, ${collection.title}, ${collection.slug},
        ${collection.purpose}, ${collection.description}, ${collection.amount},
        ${collection.isFixedAmount}, ${collection.isReceiptRequired},
        ${treasuryAccountIds[i % treasuryAccountIds.length]}, ${collection.status}
      )
      returning id
    `;
    collectionIds.push(row.id);
  }

  const cadetRows = await sql<{ id: number; member_id: number }[]>`
    select id, member_id from cadets order by id limit 6
  `;

  await sql`
    insert into collection_payments
      (collection_id, member_id, amount_paid, receipt_path, paid_at)
    values
      (${collectionIds[0]}, ${cadetRows[0].member_id}, '25.00', 'payments/seed/receipt.pdf', '2026-02-16T08:00:00.000Z')
  `;

  for (const expense of DEFAULT_EXPENSES) {
    const [row] = await sql<[{ id: number }]>`
      insert into expenses (intake_id, treasurer_id, title, description, amount)
      values (${intakeIds[0]}, ${adminUserRow.id}, ${expense.title}, ${expense.description}, ${expense.amount})
      returning id
    `;

    if (expense.receiptPath) {
      await sql`
        insert into expense_receipts (expense_id, file_path)
        values (${row.id}, ${expense.receiptPath})
      `;
    }
  }

  await sql`
    insert into cadet_accounts
      (member_id, bank_name, account_number, duitnow_id, qr_code_path)
    values
      (${cadetRows[0].member_id}, 'RHB', 3344556677, 60112233445, 'cadet-accounts/seed/qr.png')
  `;

  for (const claim of DEFAULT_CLAIMS) {
    await sql`
      insert into claims (
        member_id, intake_id, title, amount, receipt_path, qr_code_path,
        description, status, fulfilled_at, rejected_at
      )
      values (
        ${cadetRows[0].member_id}, ${intakeIds[0]}, ${claim.title}, ${claim.amount},
        ${claim.receiptPath}, ${claim.qrCodePath}, ${claim.description}, ${claim.status},
        ${claim.fulfilledAt}, ${claim.rejectedAt}
      )
    `;
  }

  const sessionRows = await sql<{ id: number }[]>`
    select id from sessions order by id limit 4
  `;
  const examIds: number[] = [];
  for (let i = 0; i < sessionRows.length; i += 1) {
    const [row] = await sql<[{ id: number }]>`
      insert into exams (session_id, name, exam_date)
      values (${sessionRows[i].id}, ${`Assessment ${i + 1}`}, ${`2026-0${i + 1}-15T08:00:00.000Z`})
      returning id
    `;
    examIds.push(row.id);
  }

  for (let i = 0; i < examIds.length; i += 1) {
    await sql`
      insert into academic_exam_results (exam_id, cadet_id, score, grade)
      values (${examIds[i]}, ${cadetRows[i].id}, ${80 - i * 7.5}, ${i < 2 ? "A" : "B"})
    `;
  }

}

seed()
  .then(async () => {
    console.log(`Seeded successfully.`);
    await sql.end();
  })
  .catch(async (error) => {
    console.error(error);
    await sql.end();
    process.exit(1);
  });
