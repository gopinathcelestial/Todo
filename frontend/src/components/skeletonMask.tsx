import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
interface SkeletonmaskProps {
  viewProp: string;
}

export const Skeletonmask: React.FC<SkeletonmaskProps> = ({ viewProp }) => {
  return (
    <ul className={`tasksList mt-4 grid gap-2 sm:gap-4 xl:gap-6 ${viewProp} items-end`}>
      {[...Array(10)].map((_, index) => (
        <li key={index}>
          <article className="bg-slate-100 rounded-lg p-3 sm:p-4 flex text-left transition hover:shadow-lg hover:shadow-slate-300 dark:bg-slate-800 dark:hover:shadow-transparent flex-col h-52 sm:h-64">
            <Skeleton height={30} />
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between mb-2"></div>
              <div><Skeleton /></div>
              <div><Skeleton /></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="w-20"><Skeleton /></div>
              <div className="w-5"><Skeleton /></div>
              <div className="w-20"><Skeleton /></div>
              <div className="w-5"><Skeleton /></div>
            </div>
            <div className="flex justify-between items-center border-dashed border-slate-200 dark:border-slate-700/[.3] border-t-2 w-full pt-4 mt-4">
              <Skeleton />
              <div className="flex items-center">
                <div><Skeleton height={30} width={30} circle={true} /></div>
                <div className="ms-3 whitespace-nowrap"></div>
                <div className="w-2"><Skeleton height={30} /></div>
              </div>
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
};
