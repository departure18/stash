import React, { useState } from "react";
import { useIntl } from "react-intl";
import * as GQL from "src/core/generated-graphql";
import {
  ScrapeDialog,
  ScrapeResult,
  ScrapedInputGroupRow,
  ScrapedImageRow,
  ScrapeDialogRow,
  ScrapedTextAreaRow,
  ScrapedCountryRow,
} from "src/components/Shared/ScrapeDialog";
import { useTagCreate } from "src/core/StashService";
import { Form } from "react-bootstrap";
import { TagSelect } from "src/components/Shared/Select";
import { useToast } from "src/hooks/Toast";
import clone from "lodash-es/clone";
import {
  genderStrings,
  genderToString,
  stringToGender,
} from "src/utils/gender";
import {
  circumcisedStrings,
  circumcisedToString,
  stringToCircumcised,
} from "src/utils/circumcised";
import { IStashBox } from "./PerformerStashBoxModal";

function renderScrapedGender(
  result: ScrapeResult<string>,
  isNew?: boolean,
  onChange?: (value: string) => void
) {
  const selectOptions = [""].concat(genderStrings);

  return (
    <Form.Control
      as="select"
      className="input-control"
      disabled={!isNew}
      plaintext={!isNew}
      value={isNew ? result.newValue : result.originalValue}
      onChange={(e) => {
        if (isNew && onChange) {
          onChange(e.currentTarget.value);
        }
      }}
    >
      {selectOptions.map((opt) => (
        <option value={opt} key={opt}>
          {opt}
        </option>
      ))}
    </Form.Control>
  );
}

function renderScrapedGenderRow(
  title: string,
  result: ScrapeResult<string>,
  onChange: (value: ScrapeResult<string>) => void
) {
  return (
    <ScrapeDialogRow
      title={title}
      result={result}
      renderOriginalField={() => renderScrapedGender(result)}
      renderNewField={() =>
        renderScrapedGender(result, true, (value) =>
          onChange(result.cloneWithValue(value))
        )
      }
      onChange={onChange}
    />
  );
}

function renderScrapedTags(
  result: ScrapeResult<string[]>,
  isNew?: boolean,
  onChange?: (value: string[]) => void
) {
  const resultValue = isNew ? result.newValue : result.originalValue;
  const value = resultValue ?? [];

  return (
    <TagSelect
      isMulti
      className="form-control react-select"
      isDisabled={!isNew}
      onSelect={(items) => {
        if (onChange) {
          onChange(items.map((i) => i.id));
        }
      }}
      ids={value}
    />
  );
}

function renderScrapedTagsRow(
  title: string,
  result: ScrapeResult<string[]>,
  onChange: (value: ScrapeResult<string[]>) => void,
  newTags: GQL.ScrapedTag[],
  onCreateNew?: (value: GQL.ScrapedTag) => void
) {
  return (
    <ScrapeDialogRow
      title={title}
      result={result}
      renderOriginalField={() => renderScrapedTags(result)}
      renderNewField={() =>
        renderScrapedTags(result, true, (value) =>
          onChange(result.cloneWithValue(value))
        )
      }
      newValues={newTags}
      onChange={onChange}
      onCreateNew={(i) => {
        if (onCreateNew) onCreateNew(newTags[i]);
      }}
    />
  );
}

function renderScrapedCircumcised(
  result: ScrapeResult<string>,
  isNew?: boolean,
  onChange?: (value: string) => void
) {
  const selectOptions = [""].concat(circumcisedStrings);

  return (
    <Form.Control
      as="select"
      className="input-control"
      disabled={!isNew}
      plaintext={!isNew}
      value={isNew ? result.newValue : result.originalValue}
      onChange={(e) => {
        if (isNew && onChange) {
          onChange(e.currentTarget.value);
        }
      }}
    >
      {selectOptions.map((opt) => (
        <option value={opt} key={opt}>
          {opt}
        </option>
      ))}
    </Form.Control>
  );
}

function renderScrapedCircumcisedRow(
  title: string,
  result: ScrapeResult<string>,
  onChange: (value: ScrapeResult<string>) => void
) {
  return (
    <ScrapeDialogRow
      title={title}
      result={result}
      renderOriginalField={() => renderScrapedCircumcised(result)}
      renderNewField={() =>
        renderScrapedCircumcised(result, true, (value) =>
          onChange(result.cloneWithValue(value))
        )
      }
      onChange={onChange}
    />
  );
}

interface IPerformerScrapeDialogProps {
  performer: Partial<GQL.PerformerUpdateInput>;
  scraped: GQL.ScrapedPerformer;
  scraper?: GQL.Scraper | IStashBox;

  onClose: (scrapedPerformer?: GQL.ScrapedPerformer) => void;
}

export const PerformerScrapeDialog: React.FC<IPerformerScrapeDialogProps> = (
  props: IPerformerScrapeDialogProps
) => {
  const intl = useIntl();

  const endpoint = (props.scraper as IStashBox)?.endpoint ?? undefined;

  function getCurrentRemoteSiteID() {
    if (!endpoint) {
      return;
    }

    return props.performer.stash_ids?.find((s) => s.endpoint === endpoint)
      ?.stash_id;
  }

  function translateScrapedGender(scrapedGender?: string | null) {
    if (!scrapedGender) {
      return;
    }

    let retEnum: GQL.GenderEnum | undefined;

    // try to translate from enum values first
    const upperGender = scrapedGender.toUpperCase();
    const asEnum = genderToString(upperGender);
    if (asEnum) {
      retEnum = stringToGender(asEnum);
    } else {
      // try to match against gender strings
      const caseInsensitive = true;
      retEnum = stringToGender(scrapedGender, caseInsensitive);
    }

    return genderToString(retEnum);
  }

  function translateScrapedCircumcised(scrapedCircumcised?: string | null) {
    if (!scrapedCircumcised) {
      return;
    }

    let retEnum: GQL.CircumisedEnum | undefined;

    // try to translate from enum values first
    const upperCircumcised = scrapedCircumcised.toUpperCase();
    const asEnum = circumcisedToString(upperCircumcised);
    if (asEnum) {
      retEnum = stringToCircumcised(asEnum);
    } else {
      // try to match against circumcised strings
      const caseInsensitive = true;
      retEnum = stringToCircumcised(scrapedCircumcised, caseInsensitive);
    }

    return circumcisedToString(retEnum);
  }

  const [name, setName] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.name, props.scraped.name)
  );
  const [disambiguation, setDisambiguation] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.disambiguation,
      props.scraped.disambiguation
    )
  );
  const [aliases, setAliases] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.alias_list?.join(", "),
      props.scraped.aliases
    )
  );
  const [birthdate, setBirthdate] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.birthdate, props.scraped.birthdate)
  );
  const [deathDate, setDeathDate] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.death_date,
      props.scraped.death_date
    )
  );
  const [ethnicity, setEthnicity] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.ethnicity, props.scraped.ethnicity)
  );
  const [country, setCountry] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.country, props.scraped.country)
  );
  const [hairColor, setHairColor] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.hair_color,
      props.scraped.hair_color
    )
  );
  const [eyeColor, setEyeColor] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.eye_color, props.scraped.eye_color)
  );
  const [height, setHeight] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.height_cm?.toString(),
      props.scraped.height
    )
  );
  const [weight, setWeight] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.weight?.toString(),
      props.scraped.weight
    )
  );
  const [penisLength, setPenisLength] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.penis_length?.toString(),
      props.scraped.penis_length
    )
  );
  const [measurements, setMeasurements] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.measurements,
      props.scraped.measurements
    )
  );
  const [fakeTits, setFakeTits] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.fake_tits, props.scraped.fake_tits)
  );
  const [careerLength, setCareerLength] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.career_length,
      props.scraped.career_length
    )
  );
  const [tattoos, setTattoos] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.tattoos, props.scraped.tattoos)
  );
  const [piercings, setPiercings] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.piercings, props.scraped.piercings)
  );
  const [url, setURL] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.url, props.scraped.url)
  );
  const [twitter, setTwitter] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.twitter, props.scraped.twitter)
  );
  const [instagram, setInstagram] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.instagram, props.scraped.instagram)
  );
  const [gender, setGender] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      genderToString(props.performer.gender),
      translateScrapedGender(props.scraped.gender)
    )
  );
  const [circumcised, setCircumcised] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      circumcisedToString(props.performer.circumcised),
      translateScrapedCircumcised(props.scraped.circumcised)
    )
  );
  const [details, setDetails] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(props.performer.details, props.scraped.details)
  );
  const [remoteSiteID, setRemoteSiteID] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      getCurrentRemoteSiteID(),
      props.scraped.remote_site_id
    )
  );

  const [createTag] = useTagCreate();
  const Toast = useToast();

  interface IHasStoredID {
    stored_id?: string | null;
  }

  function mapStoredIdObjects(
    scrapedObjects?: IHasStoredID[]
  ): string[] | undefined {
    if (!scrapedObjects) {
      return undefined;
    }
    const ret = scrapedObjects
      .map((p) => p.stored_id)
      .filter((p) => {
        return p !== undefined && p !== null;
      }) as string[];

    if (ret.length === 0) {
      return undefined;
    }

    // sort by id numerically
    ret.sort((a, b) => {
      return parseInt(a, 10) - parseInt(b, 10);
    });

    return ret;
  }

  function sortIdList(idList?: string[] | null) {
    if (!idList) {
      return;
    }

    const ret = clone(idList);
    // sort by id numerically
    ret.sort((a, b) => {
      return parseInt(a, 10) - parseInt(b, 10);
    });

    return ret;
  }

  const [tags, setTags] = useState<ScrapeResult<string[]>>(
    new ScrapeResult<string[]>(
      sortIdList(props.performer.tag_ids ?? undefined),
      mapStoredIdObjects(props.scraped.tags ?? undefined)
    )
  );

  const [newTags, setNewTags] = useState<GQL.ScrapedTag[]>(
    props.scraped.tags?.filter((t) => !t.stored_id) ?? []
  );

  const [image, setImage] = useState<ScrapeResult<string>>(
    new ScrapeResult<string>(
      props.performer.image,
      props.scraped.images && props.scraped.images.length > 0
        ? props.scraped.images[0]
        : undefined
    )
  );

  const allFields = [
    name,
    disambiguation,
    aliases,
    birthdate,
    ethnicity,
    country,
    eyeColor,
    height,
    measurements,
    fakeTits,
    penisLength,
    circumcised,
    careerLength,
    tattoos,
    piercings,
    url,
    twitter,
    instagram,
    gender,
    image,
    tags,
    details,
    deathDate,
    hairColor,
    weight,
    remoteSiteID,
  ];
  // don't show the dialog if nothing was scraped
  if (allFields.every((r) => !r.scraped)) {
    props.onClose();
    return <></>;
  }

  async function createNewTag(toCreate: GQL.ScrapedTag) {
    const tagInput: GQL.TagCreateInput = { name: toCreate.name ?? "" };
    try {
      const result = await createTag({
        variables: {
          input: tagInput,
        },
      });

      // add the new tag to the new tags value
      const tagClone = tags.cloneWithValue(tags.newValue);
      if (!tagClone.newValue) {
        tagClone.newValue = [];
      }
      tagClone.newValue.push(result.data!.tagCreate!.id);
      setTags(tagClone);

      // remove the tag from the list
      const newTagsClone = newTags.concat();
      const pIndex = newTagsClone.indexOf(toCreate);
      newTagsClone.splice(pIndex, 1);

      setNewTags(newTagsClone);

      Toast.success({
        content: (
          <span>
            Created tag: <b>{toCreate.name}</b>
          </span>
        ),
      });
    } catch (e) {
      Toast.error(e);
    }
  }

  function makeNewScrapedItem(): GQL.ScrapedPerformer {
    const newImage = image.getNewValue();
    return {
      name: name.getNewValue() ?? "",
      disambiguation: disambiguation.getNewValue(),
      aliases: aliases.getNewValue(),
      birthdate: birthdate.getNewValue(),
      ethnicity: ethnicity.getNewValue(),
      country: country.getNewValue(),
      eye_color: eyeColor.getNewValue(),
      height: height.getNewValue(),
      measurements: measurements.getNewValue(),
      fake_tits: fakeTits.getNewValue(),
      career_length: careerLength.getNewValue(),
      tattoos: tattoos.getNewValue(),
      piercings: piercings.getNewValue(),
      url: url.getNewValue(),
      twitter: twitter.getNewValue(),
      instagram: instagram.getNewValue(),
      gender: gender.getNewValue(),
      tags: tags.getNewValue()?.map((m) => {
        return {
          stored_id: m,
          name: "",
        };
      }),
      images: newImage ? [newImage] : undefined,
      details: details.getNewValue(),
      death_date: deathDate.getNewValue(),
      hair_color: hairColor.getNewValue(),
      weight: weight.getNewValue(),
      penis_length: penisLength.getNewValue(),
      circumcised: circumcised.getNewValue(),
      remote_site_id: remoteSiteID.getNewValue(),
    };
  }

  function renderScrapeRows() {
    return (
      <>
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "name" })}
          result={name}
          onChange={(value) => setName(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "disambiguation" })}
          result={disambiguation}
          onChange={(value) => setDisambiguation(value)}
        />
        <ScrapedTextAreaRow
          title={intl.formatMessage({ id: "aliases" })}
          result={aliases}
          onChange={(value) => setAliases(value)}
        />
        {renderScrapedGenderRow(
          intl.formatMessage({ id: "gender" }),
          gender,
          (value) => setGender(value)
        )}
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "birthdate" })}
          result={birthdate}
          onChange={(value) => setBirthdate(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "death_date" })}
          result={deathDate}
          onChange={(value) => setDeathDate(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "ethnicity" })}
          result={ethnicity}
          onChange={(value) => setEthnicity(value)}
        />
        <ScrapedCountryRow
          title={intl.formatMessage({ id: "country" })}
          result={country}
          onChange={(value) => setCountry(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "hair_color" })}
          result={hairColor}
          onChange={(value) => setHairColor(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "eye_color" })}
          result={eyeColor}
          onChange={(value) => setEyeColor(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "weight" })}
          result={weight}
          onChange={(value) => setWeight(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "height" })}
          result={height}
          onChange={(value) => setHeight(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "penis_length" })}
          result={penisLength}
          onChange={(value) => setPenisLength(value)}
        />
        {renderScrapedCircumcisedRow(
          intl.formatMessage({ id: "circumcised" }),
          circumcised,
          (value) => setCircumcised(value)
        )}
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "measurements" })}
          result={measurements}
          onChange={(value) => setMeasurements(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "fake_tits" })}
          result={fakeTits}
          onChange={(value) => setFakeTits(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "career_length" })}
          result={careerLength}
          onChange={(value) => setCareerLength(value)}
        />
        <ScrapedTextAreaRow
          title={intl.formatMessage({ id: "tattoos" })}
          result={tattoos}
          onChange={(value) => setTattoos(value)}
        />
        <ScrapedTextAreaRow
          title={intl.formatMessage({ id: "piercings" })}
          result={piercings}
          onChange={(value) => setPiercings(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "url" })}
          result={url}
          onChange={(value) => setURL(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "twitter" })}
          result={twitter}
          onChange={(value) => setTwitter(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "instagram" })}
          result={instagram}
          onChange={(value) => setInstagram(value)}
        />
        <ScrapedTextAreaRow
          title={intl.formatMessage({ id: "details" })}
          result={details}
          onChange={(value) => setDetails(value)}
        />
        {renderScrapedTagsRow(
          intl.formatMessage({ id: "tags" }),
          tags,
          (value) => setTags(value),
          newTags,
          createNewTag
        )}
        <ScrapedImageRow
          title={intl.formatMessage({ id: "performer_image" })}
          className="performer-image"
          result={image}
          onChange={(value) => setImage(value)}
        />
        <ScrapedInputGroupRow
          title={intl.formatMessage({ id: "stash_id" })}
          result={remoteSiteID}
          locked
          onChange={(value) => setRemoteSiteID(value)}
        />
      </>
    );
  }

  return (
    <ScrapeDialog
      title={intl.formatMessage(
        { id: "dialogs.scrape_entity_title" },
        { entity_type: intl.formatMessage({ id: "performer" }) }
      )}
      renderScrapeRows={renderScrapeRows}
      onClose={(apply) => {
        props.onClose(apply ? makeNewScrapedItem() : undefined);
      }}
    />
  );
};
