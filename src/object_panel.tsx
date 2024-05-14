import * as React from 'react';
import { Rows, Button, Alert, LoadingIndicator } from '@canva/app-ui-kit';
import styles from 'styles/components.css';
import { appProcess } from '@canva/preview/platform';
import { useOverlay } from 'utils/use_overlay_hook';
import { useSelection } from 'utils/use_selection_hook';
import { getTemporaryUrl } from '@canva/asset';
import { LaunchParams, EffectParams } from './app';
import { PresetGrid } from './preset_grid';
import { ParamSlider } from './ParamSlider';

const initialParams: EffectParams = {
  thickDistort: 10,
  fineDistort: 0,
  position: 0,
  linesAmount: 0,
  width: 0,
  static: 0.5,
};

export const ObjectPanel = () => {
  const {
    canOpen,
    isOpen,
    open,
    close: closeOverlay,
  } = useOverlay('image_selection');
  const selection = useSelection('image');
  const [params, setParams] = React.useState<EffectParams>(initialParams);
  const [isNothingSelected, setIsNothingSelected] =
    React.useState<boolean>(false);
  const [isMultipleSelected, setIsMultipleSelected] = React.useState(false);
  const [imageLoaded, setImageLoaded] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isValidSelection, setIsValidSelection] =
    React.useState<boolean>(false);
  const [imageBlob, setImageBlob] = React.useState<Blob | undefined>();
  const [mimeType, setMimeType] = React.useState<string>('');

  const handlePresetClick = (presetParams) => {
    if (!isOpen) {
      //OPEN OVERLAY
      setImageLoaded(false);
      open({
        launchParameters: {
          imageBlob: imageBlob,
          mimeType: mimeType,
          effectParams: presetParams, //open with default params
        } satisfies LaunchParams,
      });
    }
    setParams(presetParams);
    appProcess.broadcastMessage(presetParams);
  };

  const onSliderChange = (paramName, value) => {
    setParams((prevParams) => {
      return {
        ...prevParams,
        [paramName]: value,
      };
    });
    appProcess.broadcastMessage({
      ...params,
      [paramName]: value,
    });
  };

  React.useEffect(() => {
    async function checkSelection() {
      const draft = await selection.read();
      setIsMultipleSelected(false);
      setIsValidSelection(false);
      //check for no selection
      if (draft.contents.length === 0) {
        setIsNothingSelected(true);
        return;
      }
      //check for multiple images
      if (draft.contents.length > 1) {
        setIsMultipleSelected(true);
        setIsNothingSelected(false);
        return;
      }

      //download image and check mimeType
      const { url } = await getTemporaryUrl({
        type: 'IMAGE',
        ref: draft.contents[0].ref,
      });
      const response = await fetch(url, { mode: 'cors' });
      const imageBlob = await response.blob();
      const mimeType = imageBlob.type;
      setImageBlob(imageBlob);
      setMimeType(mimeType);

      if (draft.contents.length === 1) {
        setIsNothingSelected(false);
        setIsValidSelection(true);
        return;
      }
    }
    checkSelection();
  }, [selection]);

  React.useEffect(() => {
    // listen for if image is loaded in webgl to enable save button
    return void appProcess.registerOnMessage((_, message) => {
      if (!message) {
        return;
      }

      if (message === 'image-loaded') setImageLoaded(true);

      // if (message === 'overlay-closed') {
      //   //overlay was closed reset preset to 'none'
      //   setParams(initialParams);
      // }
    });
  }, []);

  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        <>
          {isNothingSelected && (
            <Alert tone="info">Select an image to apply an effect.</Alert>
          )}

          {isMultipleSelected && (
            <Alert tone="critical">
              Select a single image to apply an effect.
            </Alert>
          )}
          <PresetGrid
            handlePresetClick={handlePresetClick}
            disabled={!isValidSelection}
          />
          {isOpen && (
            <>
              <ParamSlider
                label="Thick distort"
                paramName="thickDistort"
                min="0"
                max="2"
                step="0.01"
                origin="0"
                defaultValue={initialParams.thickDistort}
                value={params.thickDistort}
                onChange={onSliderChange}
                disabled={!isOpen}
              />
              <ParamSlider
                label="Fine distort"
                paramName="fineDistort"
                min="0"
                max="2"
                step="0.01"
                origin="0"
                defaultValue={initialParams.fineDistort}
                value={params.fineDistort}
                onChange={onSliderChange}
                disabled={!isOpen}
              />
              <ParamSlider
                label="Position"
                paramName="position"
                min="0"
                max="1"
                step="0.01"
                origin="0"
                defaultValue={initialParams.position}
                value={params.position}
                onChange={onSliderChange}
                disabled={!isOpen}
              />

              <ParamSlider
                label="Scanlines Amount"
                paramName="linesAmount"
                min="0"
                max="1"
                step="0.01"
                origin="0"
                defaultValue={initialParams.linesAmount}
                value={params.linesAmount}
                onChange={onSliderChange}
                disabled={!isOpen}
              />
              <ParamSlider
                label="Scanlines width"
                paramName="width"
                min="0.2"
                max="1"
                step="0.01"
                origin="0"
                defaultValue={initialParams.width}
                value={params.width}
                onChange={onSliderChange}
                disabled={!isOpen}
              />
              <ParamSlider
                label="Static"
                paramName="static"
                min="0"
                max="1"
                step="0.01"
                origin="0"
                defaultValue={initialParams.static}
                value={params.static}
                onChange={onSliderChange}
                disabled={!isOpen}
              />
              <Button
                variant="primary"
                onClick={() => {
                  closeOverlay({ reason: 'completed' });
                }}
                stretch
                disabled={!imageLoaded || !isOpen}
                loading={isSaving}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  closeOverlay({ reason: 'aborted' });
                }}
                stretch
                disabled={!isOpen}
              >
                Cancel
              </Button>
            </>
          )}
        </>
      </Rows>
    </div>
  );
};
