import ConverterUtility from '@/components/ConverterUtility';

export default function Page() {
    return (
        <div className="flex flex-col items-center justify-center w-screen h-screen">
            <div className="container max-w-4xl mx-auto">
                <ConverterUtility />
            </div>
        </div>
    );
}