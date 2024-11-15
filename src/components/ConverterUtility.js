'use client';

import { useEffect, useReducer, useState } from 'react';
import DownloadIcon from '@/assets/icons/download.svg';
import LoadingIcon from '@/assets/icons/loading.svg';

const maxScalingSteps = 8;
const imageTypes = [
    { name: 'PNG', mimeType: 'image/png', extension: 'png' },
    { name: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg' },
    { name: 'WEBP', mimeType: 'image/webp', extension: 'webp' }
];

const reducerFunc = (state, action) => {
    switch (action.type) {
        case 'PAGE_LOAD', 'RESET':
            return { state: 'initial' };
        case 'FILE_UPLOADED':
            return { state: 'loading' };
        case 'ERROR':
            return { state: 'error', message: action.message };
        case 'SET_LOADED':
            return { state: 'loaded', src: action.src, name: action.name, width: action.width, height: action.height, size: action.size, scale: 0, imageType: 'image/png', quality: 0.9, outputName: getOutputFileName({ name: action.name, scale: 0, imageType: 'image/png' }) };
        case 'SET_SCALE':
            return { ...state, scale: action.scale, outputName: getOutputFileName({ name: state.name, scale: action.scale, imageType: state.imageType }) };
        case 'SET_IMAGE_TYPE':
            return { ...state, imageType: action.mimeType, outputName: getOutputFileName({ name: state.name, scale: state.scale, imageType: action.mimeType }) };
        case 'SET_QUALITY':
            return { ...state, quality: action.value };
        default:
            return state;
    }
};

const getFileSizeText = (size) => {
    if (size < 1000) {
        return `${size} bytes`;
    } else if (size < 1000 * 1000) {
        return `${size / 1000} kilobytes`;
    }

    return `${size / (1000 * 1000)} megabytes`;
};

const getOutputFileName = ({ name, scale, imageType }) => {
    const extension = imageTypes.find((type) => type.mimeType === imageType).extension;

    const split = name.split('.');
    split[0] += ` (${2 ** scale}x)`;

    return split.slice(0, -1).join('.') + `.${extension}`;
};

export default function ConverterUtility({ className = '' }) {
    const [data, dispatch] = useReducer(reducerFunc, { state: 'loading' });
    const [parser, setParser] = useState(null);

    useEffect(() => {
        setParser(new DOMParser());
        dispatch({ type: 'PAGE_LOAD' });
    }, []);

    const handleOpenFileSelection = () => {
        try {
            const inputElem = document.createElement('input');
            inputElem.setAttribute('type', 'file');
            inputElem.setAttribute('accept', '.svg,image/svg+xml');

            inputElem.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) return;

                handleFileUpload(file);
            });

            inputElem.click();
        } catch (e) {
            console.error(e);

            dispatch({ type: 'ERROR' });
        }
    };

    const handleFileUpload = (file) => {
        try {
            dispatch({ type: 'FILE_UPLOADED' });

            const reader = new FileReader();

            reader.addEventListener('load', () => {
                handleImageData(reader.result, file.name, file.size);
            });

            reader.addEventListener('error', (error) => {
                console.error(error);

                dispatch({ type: 'ERROR', message: 'There was an error while trying to read the input file. Please check the console and refresh to try again.' });
            });

            reader.addEventListener('abort', (error) => {
                console.error(error);

                dispatch({ type: 'ERROR', message: 'The process was unexpectedly aborted while trying to read the input file. Please check the console and refresh to try again.' });
            });

            reader.readAsText(file);
        } catch (e) {
            console.error(e);

            dispatch({ type: 'ERROR' });
        }
    };

    const handleImageData = (imageData, fileName, fileSize) => {
        try {
            const svgElem = parser.parseFromString(imageData, 'image/svg+xml');

            let width, height;

            if (svgElem.activeElement.hasAttribute('width') && svgElem.activeElement.hasAttribute('height')) {
                width = parseInt(svgElem.activeElement.getAttribute('width'));
                height = parseInt(svgElem.activeElement.getAttribute('height'));
            } else if (svgElem.activeElement.hasAttribute('viewBox')) {
                const viewBox = svgElem.activeElement.getAttribute('viewBox');

                const splitValues = viewBox.split(' ');
                if (splitValues.length !== 4) return dispatch({ type: 'ERROR', message: 'The uploaded image contains an invalid value for the \'viewport\' attribute, therefore the image cannot be processed. Please reload the page and select a different image.' });

                width = parseInt(splitValues[2]), height = parseInt(splitValues[3]);
                if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) return dispatch({ type: 'ERROR', message: 'The uploaded image contains an invalid value for the \'viewport\' attribute, therefore the image cannot be processed. Please reload the page and select a different image.' });
            } else {
                return dispatch({ type: 'ERROR', message: 'The uploaded image does not contain any information about width and height, therefore the image cannot be processed. Please reload the page and select a different image.' });
            }

            dispatch({
                type: 'SET_LOADED',
                src: `data:image/svg+xml;base64,${btoa(imageData)}`,
                name: fileName,
                width,
                height,
                size: getFileSizeText(fileSize)
            });

            /* const inputImage = new Image();

            inputImage.addEventListener('load', () => {
                const canvasElem = document.createElement('canvas');
                canvasElem.setAttribute('width', width);
                canvasElem.setAttribute('height', height);

                const ctx = canvasElem.getContext('2d', { alpha: true });
                ctx.drawImage(inputImage, 0, 0, width, height);

                canvasElem.toBlob((blob) => {
                    try {
                        const src = URL.createObjectURL(blob);

                        const outputImage = document.createElement('img');
                        outputImage.src = src;

                        
                    } catch (e) {
                        console.error(e);

                        dispatch({ type: 'ERROR' });
                    }
                }, 'image/png');
            });

            inputImage.src = `data:image/svg+xml;base64,${btoa(imageData)}`; */
        } catch (e) {
            console.error(e);

            dispatch({ type: 'ERROR' });
        }
    };

    const handleQualityChange = (event) => {
        dispatch({ type: 'SET_QUALITY', value: event.target.value });
    };

    switch (data.state) {
        case 'unsupported-browser':
            return (
                <div className={`p-12 rounded-lg bg-white aspect-square flex flex-col items-center justify-center shadow-xl shadow-black/10 w-full ${className}`}>
                    <p className="text-lg text-center text-red-400">Your browser does not support features required by this website. We recommend updating your browser, or using <a href="https://svgtopng.com" className="font-bold">svgtopng.com</a> instead.</p>
                </div>
            );
        case 'loading':
            return (
                <div className={`p-12 rounded-lg bg-white aspect-square flex flex-col items-center justify-center shadow-xl shadow-black/10 w-full ${className}`}>
                    <LoadingIcon width="64" height="64" />
                </div>
            );
        case 'initial':
            return (
                <div className={`p-12 rounded-lg bg-white aspect-square flex flex-col items-center justify-center shadow-xl shadow-black/10 hover:shadow-black/20 transition-shadow w-full cursor-pointer ${className}`} onClick={handleOpenFileSelection}>
                    <p className="text-lg text-center text-neutral-400">Click or drag-and-drop onto this box to upload an SVG.</p>
                </div>
            );
        case 'loaded':
            return (
                <div className={`p-12 rounded-lg bg-white shadow-xl shadow-black/10 w-full flex flex-col gap-8 ${className}`}>
                    <div>
                        <p className="font-medium text-neutral-700">Preview</p>
                        <p className="mt-1 text-sm italic text-neutral-500">{data.name}</p>
                        <div className="w-32 h-32 mt-1 bg-center bg-no-repeat bg-contain border border-neutral-500" style={{ backgroundImage: `url("${data.src}")` }} />
                        <p className="mt-1 text-sm text-neutral-500">{data.width}&times;{data.height} &mdash; {data.size}</p>
                    </div>
                    <div>
                        <p className="font-medium text-neutral-700">Scaling</p>
                        <div className="flex gap-3 mt-1">
                            {
                                Array(maxScalingSteps).fill().map((_, index) => (
                                    <button type="button" className={`text-sm p-1 ${data.scale === index ? 'text-black underline underline-offset-2' : 'text-neutral-500'}`} onClick={() => dispatch({ type: 'SET_SCALE', scale: index })} key={index}>{2 ** index}x</button>
                                ))
                            }
                        </div>
                    </div>
                    <div>
                        <p className="font-medium text-neutral-700">Format</p>
                        <div className="flex gap-3 mt-1">
                            {
                                imageTypes.map(({ name, mimeType }, index) => (
                                    <button type="button" className={`text-sm p-1 ${data.imageType === mimeType ? 'text-black underline underline-offset-2' : 'text-neutral-500'}`} onClick={() => dispatch({ type: 'SET_IMAGE_TYPE', mimeType })} key={index}>{name}</button>
                                ))
                            }
                        </div>
                    </div>
                    <div>
                        <p className="font-medium text-neutral-700">Quality</p>
                        <div className="flex items-center gap-3">
                            <span className="w-10 text-sm text-right text-neutral-500">{data.imageType === 'image/png' ? '100' : Math.trunc(data.quality * 100)}%</span>
                            <input type="range" min="0" max="1" step="0.1" className="mt-1" defaultValue={data.quality} disabled={data.imageType === 'image/png'} onChange={handleQualityChange} />
                        </div>
                    </div>
                    <div>
                        <p className="font-medium text-neutral-700">Result</p>
                        <p className="mt-1 text-sm italic text-neutral-500">{data.outputName}</p>
                        <p className="mt-1 text-sm text-neutral-500">{Math.floor(data.width * (2 ** data.scale))}&times;{Math.floor(data.height * (2 ** data.scale))}</p>
                        <div className="flex items-center gap-3 mt-1">
                            <button type="button" className="flex items-center gap-2 px-3 py-2 text-sm border border-black" onClick={() => dispatch({ type: 'DOWNLOAD' })}>
                                <DownloadIcon width="16" height="16" />
                                <span>Download</span>
                            </button>
                            <button type="button" className="px-3 py-2 text-sm text-red-500 border border-red-500" onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
                        </div>
                    </div>
                </div>
            );
        case 'error':
            return (
                <div className={`p-12 rounded-lg bg-white aspect-square flex flex-col items-center justify-center shadow-xl shadow-black/10 w-full ${className}`}>
                    <p className="text-lg text-center text-red-400">{data.message || 'There was an error while loading this stage of the website. Please check the console for more information and refresh to try again.'}</p>
                </div>
            );
        default:
            return null;
    }
}